from datetime import datetime, timezone
import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from app.database import db
from app.schemas.admin import (
    AdminStatsResponse,
    ModerateListingRequest,
    BanUserRequest,
    AddAllowedDomainRequest,
    AuditLogEntry,
)
from app.schemas.listings import ListingResponse
from app.routers.listings import _format_listing_response
from app.security.auth import get_current_admin
from app.services.expiry_job import run_expiry_scan

router = APIRouter(prefix="/api/v1/admin", tags=["Admin Portal (RBAC)"])

@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_stats(admin_user: Dict[str, Any] = Depends(get_current_admin)):
    """Summary metrics of platform activity and security status."""
    total_users = len(db.profiles)
    verified_students = len([p for p in db.profiles if p.get("is_verified")])
    active_listings = len([l for l in db.listings if l.get("status") == "active"])
    flagged_listings = len([l for l in db.listings if l.get("status") == "flagged"])
    total_audit_events = len(db.audit_logs)

    return AdminStatsResponse(
        total_users=total_users,
        verified_students=verified_students,
        active_listings=active_listings,
        flagged_listings=flagged_listings,
        total_audit_events=total_audit_events
    )

@router.get("/flagged-listings", response_model=List[ListingResponse])
def get_flagged_listings(admin_user: Dict[str, Any] = Depends(get_current_admin)):
    """Returns all listings flagged by ML moderation for review."""
    flagged = [l for l in db.listings if l.get("status") == "flagged"]
    return [_format_listing_response(l, admin_user) for l in flagged]

@router.post("/listings/{id}/moderate")
def moderate_listing(
    id: str,
    payload: ModerateListingRequest,
    admin_user: Dict[str, Any] = Depends(get_current_admin)
):
    """Admin approves or deletes a flagged listing."""
    listing = next((l for l in db.listings if l["id"] == id), None)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    now = datetime.now(timezone.utc)
    if payload.action == "approve":
        listing["status"] = "active"
        listing["updated_at"] = now.isoformat()
        db.audit_logs.append({
            "id": str(uuid.uuid4()),
            "actor_id": admin_user["id"],
            "action": "listing_approved_by_admin",
            "target_type": "listing",
            "target_id": id,
            "details": {"title": listing["title"]},
            "created_at": now.isoformat()
        })
        return {"message": "Listing approved and activated"}
    else:
        db.listings = [l for l in db.listings if l["id"] != id]
        db.listing_images = [img for img in db.listing_images if img["listing_id"] != id]
        db.contact_details = [c for c in db.contact_details if c["listing_id"] != id]
        db.audit_logs.append({
            "id": str(uuid.uuid4()),
            "actor_id": admin_user["id"],
            "action": "listing_deleted_by_admin",
            "target_type": "listing",
            "target_id": id,
            "details": {"title": listing["title"]},
            "created_at": now.isoformat()
        })
        return {"message": "Listing removed"}

@router.get("/users")
def get_all_users(admin_user: Dict[str, Any] = Depends(get_current_admin)):
    """Lists users with verification and ban status."""
    return db.profiles

@router.post("/users/{id}/ban")
def toggle_user_ban(
    id: str,
    payload: BanUserRequest,
    admin_user: Dict[str, Any] = Depends(get_current_admin)
):
    """Bans or unbans a user account. Banned users are blocked from all endpoints."""
    target_user = next((p for p in db.profiles if p["id"] == id), None)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    target_user["is_banned"] = payload.is_banned
    target_user["updated_at"] = datetime.now(timezone.utc).isoformat()

    db.audit_logs.append({
        "id": str(uuid.uuid4()),
        "actor_id": admin_user["id"],
        "action": "user_banned" if payload.is_banned else "user_unbanned",
        "target_type": "user",
        "target_id": id,
        "details": {"email": target_user["email"], "reason": payload.reason},
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    return {
        "message": f"User {'banned' if payload.is_banned else 'unbanned'} successfully",
        "user_id": id,
        "is_banned": payload.is_banned
    }

@router.get("/allowed-domains")
def get_allowed_domains_admin(admin_user: Dict[str, Any] = Depends(get_current_admin)):
    """Lists all allowed institutional domains."""
    return db.allowed_domains

@router.post("/allowed-domains")
def add_allowed_domain(
    payload: AddAllowedDomainRequest,
    admin_user: Dict[str, Any] = Depends(get_current_admin)
):
    """Adds a new approved institutional domain to the whitelist."""
    domain_clean = payload.domain.strip().lower()
    existing = next((d for d in db.allowed_domains if d["domain"].lower() == domain_clean), None)
    if existing:
        raise HTTPException(status_code=400, detail="Domain already exists in whitelist")

    new_domain = {
        "id": str(uuid.uuid4()),
        "domain": domain_clean,
        "college_name": payload.college_name.strip(),
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    db.allowed_domains.append(new_domain)

    db.audit_logs.append({
        "id": str(uuid.uuid4()),
        "actor_id": admin_user["id"],
        "action": "domain_whitelisted",
        "target_type": "allowed_domain",
        "target_id": new_domain["id"],
        "details": {"domain": domain_clean, "college_name": payload.college_name},
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    return new_domain

@router.delete("/allowed-domains/{id}")
def delete_allowed_domain(
    id: str,
    admin_user: Dict[str, Any] = Depends(get_current_admin)
):
    """Deletes or deactivates an institutional domain."""
    db.allowed_domains = [d for d in db.allowed_domains if d["id"] != id]
    return {"message": "Domain removed from whitelist"}

@router.get("/audit-logs", response_model=List[AuditLogEntry])
def get_audit_logs(
    limit: int = 50,
    admin_user: Dict[str, Any] = Depends(get_current_admin)
):
    """Returns system security audit logs."""
    logs = sorted(db.audit_logs, key=lambda l: l["created_at"], reverse=True)
    return logs[:limit]

@router.post("/run-expiry-check")
def trigger_expiry_scan(admin_user: Dict[str, Any] = Depends(get_current_admin)):
    """Manually triggers the 30-day listing auto-expiry scanner."""
    return run_expiry_scan()
