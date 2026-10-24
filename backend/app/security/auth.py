from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, Tuple
import jwt
import httpx
from fastapi import Header, HTTPException, status, Depends
from app.config import settings
from app.database import db

JWT_ALGORITHM = "HS256"

_jwk_client: Optional[jwt.PyJWKClient] = None

def get_jwk_client() -> Optional[jwt.PyJWKClient]:
    """Caches and returns the PyJWKClient for Supabase JWKS asymmetric verification."""
    global _jwk_client
    if _jwk_client is None and settings.SUPABASE_URL:
        try:
            jwks_url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"
            _jwk_client = jwt.PyJWKClient(jwks_url, cache_keys=True)
        except Exception:
            _jwk_client = None
    return _jwk_client

def check_domain_whitelist(email: str) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Checks if an email's domain belongs to an allowed institutional domain.
    Matches exact domains (e.g. iitb.ac.in, mit.edu, pict.edu) or suffix wildcards (.edu, .ac.in, .edu.in).
    Returns (is_allowed, domain, college_name).
    """
    if not email or "@" not in email:
        return False, None, "Invalid email format"
    
    domain = email.split("@")[-1].strip().lower()
    
    # Check against database allowed_domains
    for record in db.allowed_domains:
        if not record.get("is_active", True):
            continue
        allowed_pattern = record["domain"].lower()
        if allowed_pattern.startswith("."):
            # Suffix match, e.g. .edu or .ac.in
            if domain.endswith(allowed_pattern) or domain == allowed_pattern[1:]:
                return True, domain, record["college_name"]
        else:
            # Exact domain match
            if domain == allowed_pattern or domain.endswith("." + allowed_pattern):
                return True, domain, record["college_name"]

    return False, domain, None

def create_access_token(user_id: str, email: str, role: str = "student", is_verified: bool = False, expires_delta: Optional[timedelta] = None) -> str:
    """Creates a signed JWT for local authentication."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=7)
    
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "is_verified": is_verified,
        "exp": expire,
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, settings.APP_SECRET_KEY, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> Dict[str, Any]:
    """
    Decodes and validates a JWT token.
    Supports:
    1. Local app tokens signed with APP_SECRET_KEY (HS256)
    2. Supabase tokens signed with asymmetric keys (ES256, RS256) via JWKS
    3. Supabase tokens signed with legacy SUPABASE_JWT_SECRET (HS256)
    4. Direct Supabase Auth API verification fallback (/auth/v1/user)
    """
    clean_token = token.strip()

    # 1. First attempt: Local APP_SECRET_KEY (used by demo login & system jobs)
    try:
        return jwt.decode(clean_token, settings.APP_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except Exception:
        pass

    # 2. Second attempt: Supabase JWKS asymmetric verification (ES256, RS256, HS256)
    jwk_client = get_jwk_client()
    if jwk_client:
        try:
            signing_key = jwk_client.get_signing_key_from_jwt(clean_token)
            try:
                payload = jwt.decode(
                    clean_token,
                    signing_key.key,
                    algorithms=["ES256", "RS256", "HS256"],
                    audience="authenticated"
                )
            except jwt.InvalidAudienceError:
                payload = jwt.decode(
                    clean_token,
                    signing_key.key,
                    algorithms=["ES256", "RS256", "HS256"],
                    options={"verify_aud": False}
                )

            email = payload.get("email", "")
            is_allowed, domain, college = check_domain_whitelist(email)
            payload["is_verified"] = is_allowed
            payload["domain"] = domain or (email.split("@")[-1] if "@" in email else "")
            return payload
        except Exception:
            pass

    # 3. Third attempt: Legacy Supabase JWT Secret (HS256)
    if settings.SUPABASE_JWT_SECRET:
        try:
            try:
                payload = jwt.decode(
                    clean_token,
                    settings.SUPABASE_JWT_SECRET,
                    algorithms=["HS256"],
                    audience="authenticated"
                )
            except jwt.InvalidAudienceError:
                payload = jwt.decode(
                    clean_token,
                    settings.SUPABASE_JWT_SECRET,
                    algorithms=["HS256"],
                    options={"verify_aud": False}
                )
            email = payload.get("email", "")
            is_allowed, domain, college = check_domain_whitelist(email)
            payload["is_verified"] = is_allowed
            payload["domain"] = domain or (email.split("@")[-1] if "@" in email else "")
            return payload
        except Exception:
            pass

    # 4. Fourth attempt: Direct Supabase Auth API verification (/auth/v1/user)
    if settings.SUPABASE_URL and (settings.SUPABASE_KEY or settings.SUPABASE_ANON_KEY):
        api_key = settings.SUPABASE_KEY or settings.SUPABASE_ANON_KEY
        try:
            with httpx.Client(timeout=4.0) as client:
                res = client.get(
                    f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/user",
                    headers={
                        "apikey": api_key,
                        "Authorization": f"Bearer {clean_token}"
                    }
                )
                if res.status_code == 200:
                    supa_user = res.json()
                    user_id = supa_user.get("id")
                    email = supa_user.get("email", "")
                    user_meta = supa_user.get("user_metadata", {}) or {}
                    is_allowed, domain, college = check_domain_whitelist(email)
                    return {
                        "sub": user_id,
                        "email": email,
                        "role": supa_user.get("role", "student"),
                        "is_verified": is_allowed,
                        "domain": domain or (email.split("@")[-1] if "@" in email else ""),
                        "display_name": user_meta.get("full_name") or user_meta.get("name") or (email.split("@")[0] if email else "Student"),
                        "avatar_url": user_meta.get("avatar_url")
                    }
        except Exception:
            pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token",
        headers={"WWW-Authenticate": "Bearer"},
    )

def compute_user_badges(user: Dict[str, Any]) -> list[str]:
    """Computes trust badges based on user profile and activity."""
    badges = []
    if user.get("is_verified"):
        badges.append("Verified Student")
    if user.get("batch_year"):
        badges.append(f"Batch of '{str(user['batch_year'])[-2:]}")
    if user.get("hostel_building"):
        badges.append(f"{user['hostel_building']} Resident")
    if user.get("avg_response_time_minutes") and user["avg_response_time_minutes"] <= 30:
        badges.append("Quick Responder")
    return badges

async def get_current_user_optional(authorization: Optional[str] = Header(None)) -> Optional[Dict[str, Any]]:
    """Returns current user profile if valid token provided; otherwise None (for public browsing)."""
    if not authorization:
        return None
    token = authorization.replace("Bearer ", "").strip()
    if not token:
        return None
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            return None
        user = next((p for p in db.profiles if p["id"] == user_id), None)
        if settings.SUPABASE_URL and settings.SUPABASE_KEY and (not user or not user.get("campus_id")):
            try:
                with httpx.Client(timeout=3.0) as client:
                    res = client.get(
                        f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1/profiles?id=eq.{user_id}&select=*",
                        headers={
                            "apikey": settings.SUPABASE_KEY,
                            "Authorization": f"Bearer {settings.SUPABASE_KEY}"
                        }
                    )
                    if res.status_code == 200 and res.json():
                        supa_profile = res.json()[0]
                        if not user:
                            user = supa_profile
                            db.profiles.append(user)
                        else:
                            user.update(supa_profile)
            except Exception:
                pass
        return user
    except Exception:
        return None

async def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """Requires an authenticated user."""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = authorization.replace("Bearer ", "").strip()
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")
    
    user = next((p for p in db.profiles if p["id"] == user_id), None)

    # Sync with Supabase profiles table if available and user is missing or incomplete in memory
    if settings.SUPABASE_URL and settings.SUPABASE_KEY and (not user or not user.get("campus_id")):
        try:
            with httpx.Client(timeout=3.0) as client:
                res = client.get(
                    f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1/profiles?id=eq.{user_id}&select=*",
                    headers={
                        "apikey": settings.SUPABASE_KEY,
                        "Authorization": f"Bearer {settings.SUPABASE_KEY}"
                    }
                )
                if res.status_code == 200 and res.json():
                    supa_profile = res.json()[0]
                    if not user:
                        user = supa_profile
                        db.profiles.append(user)
                    else:
                        user.update(supa_profile)
        except Exception:
            pass

    if not user:
        # If user is in Supabase token but not yet in profiles, construct entry
        user = {
            "id": user_id,
            "email": payload.get("email", ""),
            "domain": payload.get("domain") or (payload.get("email", "").split("@")[-1] if "@" in payload.get("email", "") else ""),
            "is_verified": payload.get("is_verified", False),
            "display_name": payload.get("display_name") or (payload.get("email", "").split("@")[0] if "@" in payload.get("email", "") else "Student"),
            "campus_id": None,
            "hostel_building": None,
            "batch_year": None,
            "role": payload.get("role", "student"),
            "is_banned": False,
            "avg_response_time_minutes": None,
            "avatar_url": payload.get("avatar_url"),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        db.profiles.append(user)

    if user.get("is_banned"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account has been banned.")

    return user

async def get_current_verified_user(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """
    CRITICAL SERVER-SIDE PRIVACY GUARD:
    Ensures that unverified accounts (e.g. gmail.com or unapproved domains) CANNOT
    post listings, request contacts, or access any sensitive operations.
    """
    if not user.get("is_verified"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Mandatory institutional email verification required. Only students from approved college domains can perform this action."
        )
    if user.get("is_banned"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is banned")
    return user

async def get_current_admin(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Ensures caller has admin privileges."""
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required to perform this action"
        )
    return user
