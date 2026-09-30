from datetime import datetime, timezone
import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from app.database import db
from app.schemas.auth import (
    Token,
    DemoLoginRequest,
    DomainCheckRequest,
    DomainCheckResponse,
    OnboardingRequest,
    UserProfileResponse,
)
from app.security.auth import (
    check_domain_whitelist,
    create_access_token,
    get_current_user,
    compute_user_badges,
)

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication & Verification"])

@router.post("/check-domain", response_model=DomainCheckResponse)
def check_domain(payload: DomainCheckRequest):
    """
    Checks if a student email domain is approved on the institutional whitelist.
    Enforces that unverified domains (e.g. gmail.com) are rejected from verified actions.
    """
    is_allowed, domain, college_name = check_domain_whitelist(payload.email)
    reason = None
    if not is_allowed:
        reason = f"Domain '@{domain}' is not on the approved campus list. Please use your institutional college email (.edu, .ac.in, etc.)."
    return DomainCheckResponse(
        email=payload.email,
        domain=domain or "",
        is_allowed=is_allowed,
        college_name=college_name,
        reason=reason
    )

@router.post("/login-demo", response_model=Token)
def login_demo(payload: DemoLoginRequest):
    """
    Quick demo login to test verified students, unverified guests, and admins.
    """
    query = payload.user_id_or_email.lower().strip()
    user = next((p for p in db.profiles if p["id"] == query or p["email"].lower() == query), None)
    
    if not user:
        # Check domain whitelist for new demo user
        is_allowed, domain, college_name = check_domain_whitelist(query)
        new_id = str(uuid.uuid4())
        user = {
            "id": new_id,
            "email": query,
            "domain": domain or (query.split("@")[-1] if "@" in query else ""),
            "is_verified": is_allowed,
            "display_name": query.split("@")[0].title() if "@" in query else "User",
            "campus_id": db.campuses[0]["id"] if is_allowed and db.campuses else None,
            "hostel_building": "Hostel 1" if is_allowed else None,
            "batch_year": 2026 if is_allowed else None,
            "role": "student",
            "is_banned": False,
            "avg_response_time_minutes": 20 if is_allowed else None,
            "avatar_url": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        db.profiles.append(user)

    token = create_access_token(
        user_id=user["id"],
        email=user["email"],
        role=user["role"],
        is_verified=user["is_verified"]
    )

    return Token(
        access_token=token,
        token_type="bearer",
        user_id=user["id"],
        email=user["email"],
        is_verified=user["is_verified"],
        role=user["role"]
    )

@router.get("/me", response_model=UserProfileResponse)
def get_my_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Returns the authenticated user's profile and computed trust badges."""
    campus_name = None
    if current_user.get("campus_id"):
        campus = next((c for c in db.campuses if c["id"] == current_user["campus_id"]), None)
        if campus:
            campus_name = campus["name"]

    badges = compute_user_badges(current_user)
    return UserProfileResponse(
        id=current_user["id"],
        email=current_user["email"],
        domain=current_user["domain"],
        is_verified=current_user["is_verified"],
        display_name=current_user["display_name"],
        campus_id=current_user.get("campus_id"),
        campus_name=campus_name,
        hostel_building=current_user.get("hostel_building"),
        batch_year=current_user.get("batch_year"),
        role=current_user["role"],
        is_banned=current_user["is_banned"],
        avg_response_time_minutes=current_user.get("avg_response_time_minutes"),
        avatar_url=current_user.get("avatar_url"),
        badges=badges
    )

@router.post("/onboarding", response_model=UserProfileResponse)
def complete_onboarding(
    payload: OnboardingRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Completes or updates onboarding information: display name, campus hub, hostel/building, batch year.
    """
    # Verify campus exists
    campus = next((c for c in db.campuses if c["id"] == payload.campus_id), None)
    if not campus:
        raise HTTPException(status_code=400, detail="Invalid campus ID selected")

    current_user["display_name"] = payload.display_name
    current_user["campus_id"] = payload.campus_id
    current_user["hostel_building"] = payload.hostel_building
    current_user["batch_year"] = payload.batch_year
    current_user["updated_at"] = datetime.now(timezone.utc).isoformat()

    badges = compute_user_badges(current_user)
    return UserProfileResponse(
        id=current_user["id"],
        email=current_user["email"],
        domain=current_user["domain"],
        is_verified=current_user["is_verified"],
        display_name=current_user["display_name"],
        campus_id=current_user["campus_id"],
        campus_name=campus["name"],
        hostel_building=current_user["hostel_building"],
        batch_year=current_user["batch_year"],
        role=current_user["role"],
        is_banned=current_user["is_banned"],
        avg_response_time_minutes=current_user.get("avg_response_time_minutes"),
        avatar_url=current_user.get("avatar_url"),
        badges=badges
    )

@router.get("/allowed-domains")
def get_allowed_domains():
    """Returns active allowed institutional domains."""
    return [d for d in db.allowed_domains if d.get("is_active", True)]

@router.get("/campuses")
def get_campuses():
    """Returns list of campuses for onboarding and micro-hub filtering."""
    return db.campuses
