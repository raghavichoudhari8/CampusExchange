from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, Tuple
import jwt
from fastapi import Header, HTTPException, status, Depends
from app.config import settings
from app.database import db

JWT_ALGORITHM = "HS256"

def check_domain_whitelist(email: str) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Checks if an email's domain belongs to an allowed institutional domain.
    Matches exact domains (e.g. iitb.ac.in, mit.edu) or suffix wildcards (.edu, .ac.in, .edu.in).
    Returns (is_allowed, domain, college_name).
    """
    if "@" not in email:
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
    """Decodes JWT, supporting both local secret and Supabase secret."""
    try:
        # First attempt with APP_SECRET_KEY
        return jwt.decode(token, settings.APP_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except Exception:
        pass
    
    if settings.SUPABASE_JWT_SECRET:
        try:
            return jwt.decode(token, settings.SUPABASE_JWT_SECRET, algorithms=["HS256"], audience="authenticated")
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
    if not user:
        # If user is in Supabase token but not yet in profiles, construct entry
        user = {
            "id": user_id,
            "email": payload.get("email", ""),
            "domain": payload.get("email", "").split("@")[-1] if "@" in payload.get("email", "") else "",
            "is_verified": payload.get("is_verified", False),
            "display_name": payload.get("email", "").split("@")[0],
            "campus_id": None,
            "hostel_building": None,
            "batch_year": None,
            "role": payload.get("role", "student"),
            "is_banned": False,
            "avg_response_time_minutes": None,
            "avatar_url": None,
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
