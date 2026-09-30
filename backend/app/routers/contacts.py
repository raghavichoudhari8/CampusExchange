from datetime import datetime, timezone, timedelta
import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from app.database import db
from app.schemas.contacts import (
    ContactRequestCreate,
    ContactRequestResponse,
    ContactResponseAction,
)
from app.schemas.listings import DecryptedContactInfo
from app.security.auth import (
    get_current_user,
    get_current_verified_user,
    compute_user_badges,
)
from app.security.encryption import decrypt_contact
from app.services.websocket_manager import ws_manager
from app.services.email_service import email_service

router = APIRouter(prefix="/api/v1/contacts", tags=["Contact Requests & Privacy Flow"])

def _format_contact_request(req: Dict[str, Any], caller_id: str) -> ContactRequestResponse:
    listing = next((l for l in db.listings if l["id"] == req["listing_id"]), None)
    listing_title = listing["title"] if listing else "Listing"

    buyer = next((p for p in db.profiles if p["id"] == req["buyer_id"]), None)
    buyer_name = buyer["display_name"] if buyer else "Student"
    buyer_campus = None
    if buyer and buyer.get("campus_id"):
        camp = next((c for c in db.campuses if c["id"] == buyer["campus_id"]), None)
        buyer_campus = camp["name"] if camp else None
    buyer_badges = compute_user_badges(buyer) if buyer else []

    seller = next((p for p in db.profiles if p["id"] == req["seller_id"]), None)
    seller_name = seller["display_name"] if seller else "Seller"

    # Contact details revealed ONLY IF approved AND caller is buyer or seller
    contact_details = None
    if req["status"] == "approved" and (caller_id == req["buyer_id"] or caller_id == req["seller_id"]):
        c_record = next((c for c in db.contact_details if c["listing_id"] == req["listing_id"]), None)
        if c_record:
            try:
                decrypted = decrypt_contact(c_record["encrypted_contact_value"])
                contact_details = DecryptedContactInfo(
                    contact_type=c_record["contact_type"],
                    contact_value=decrypted,
                    preferred_note=c_record.get("preferred_note")
                )
            except Exception:
                pass

    return ContactRequestResponse(
        id=req["id"],
        listing_id=req["listing_id"],
        listing_title=listing_title,
        buyer_id=req["buyer_id"],
        buyer_name=buyer_name,
        buyer_email=buyer.get("email") if caller_id == req["seller_id"] else None,
        buyer_campus=buyer_campus,
        buyer_badges=buyer_badges,
        seller_id=req["seller_id"],
        seller_name=seller_name,
        message=req.get("message"),
        status=req["status"],
        responded_at=req.get("responded_at"),
        created_at=req["created_at"],
        contact_details=contact_details
    )

@router.post("/request", response_model=ContactRequestResponse)
async def request_contact(
    payload: ContactRequestCreate,
    current_user: Dict[str, Any] = Depends(get_current_verified_user)
):
    """
    Step 1 of Privacy Flow:
    Verified student expresses interest in an item.
    Enforces:
    - Must be a verified student with an approved college email.
    - Cannot request own item.
    - One request per buyer per listing.
    - Rate-limit: max 15 requests per 24 hours.
    - Sends live WebSocket alert and Resend email to seller.
    """
    listing = next((l for l in db.listings if l["id"] == payload.listing_id), None)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    if listing["seller_id"] == current_user["id"]:
        raise HTTPException(status_code=400, detail="You cannot request contact details for your own listing")

    # One request per buyer per listing rule
    existing = next(
        (r for r in db.contact_requests if r["listing_id"] == payload.listing_id and r["buyer_id"] == current_user["id"]),
        None
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"You already have a {existing['status']} request for this item"
        )

    # Rate limiting: max 15 contact requests in last 24h
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(hours=24)
    recent_requests = [
        r for r in db.contact_requests
        if r["buyer_id"] == current_user["id"]
        and datetime.fromisoformat(r["created_at"]) > cutoff
    ]
    if len(recent_requests) >= 15:
        raise HTTPException(
            status_code=429,
            detail="Rate limit reached: Maximum 15 contact requests allowed per day for student privacy and spam protection."
        )

    req_id = str(uuid.uuid4())
    req_record = {
        "id": req_id,
        "listing_id": payload.listing_id,
        "buyer_id": current_user["id"],
        "seller_id": listing["seller_id"],
        "message": payload.message.strip() if payload.message else None,
        "status": "pending",
        "responded_at": None,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    db.contact_requests.insert(0, req_record)

    # Audit log
    db.audit_logs.append({
        "id": str(uuid.uuid4()),
        "actor_id": current_user["id"],
        "action": "contact_requested",
        "target_type": "contact_request",
        "target_id": req_id,
        "details": {"listing_id": payload.listing_id, "seller_id": listing["seller_id"]},
        "created_at": now.isoformat()
    })

    # Prepare real-time WebSocket event for the seller
    buyer_badges = compute_user_badges(current_user)
    buyer_campus = None
    if current_user.get("campus_id"):
        camp = next((c for c in db.campuses if c["id"] == current_user["campus_id"]), None)
        buyer_campus = camp["name"] if camp else None

    seller = next((p for p in db.profiles if p["id"] == listing["seller_id"]), None)

    # Real-time WebSocket push
    await ws_manager.send_personal_event(
        user_id=listing["seller_id"],
        event_type="new_contact_request",
        payload={
            "request_id": req_id,
            "listing_id": listing["id"],
            "listing_title": listing["title"],
            "buyer_name": current_user["display_name"],
            "buyer_campus": buyer_campus,
            "buyer_badges": buyer_badges,
            "message": payload.message,
            "created_at": now.isoformat()
        }
    )

    # Transactional Email Notification via Resend
    if seller:
        email_service.notify_seller_new_request(
            seller_email=seller["email"],
            seller_name=seller["display_name"],
            buyer_name=current_user["display_name"],
            buyer_campus=buyer_campus or "Campus",
            buyer_badges=buyer_badges,
            listing_title=listing["title"],
            message=payload.message
        )

    return _format_contact_request(req_record, current_user["id"])

@router.get("/my-requests", response_model=List[ContactRequestResponse])
def get_my_requests(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Returns all requests sent by the current student as a buyer."""
    requests = [r for r in db.contact_requests if r["buyer_id"] == current_user["id"]]
    return [_format_contact_request(r, current_user["id"]) for r in requests]

@router.get("/seller-requests", response_model=List[ContactRequestResponse])
def get_seller_requests(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Returns all incoming requests received by the current student as a seller."""
    requests = [r for r in db.contact_requests if r["seller_id"] == current_user["id"]]
    return [_format_contact_request(r, current_user["id"]) for r in requests]

@router.post("/request/{request_id}/respond", response_model=ContactRequestResponse)
async def respond_to_request(
    request_id: str,
    payload: ContactResponseAction,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Step 2 of Privacy Flow:
    Seller accepts or declines the contact request; or either party revokes access.
    On 'approve':
    - Decrypts contact details server-side.
    - Emits real-time WebSocket event to the buyer with decrypted credentials.
    - Sends Resend email notification to the buyer.
    - Writes to audit logs.
    On 'revoke':
    - Rescinds buyer's access to seller's contact information immediately.
    """
    req = next((r for r in db.contact_requests if r["id"] == request_id), None)
    if not req:
        raise HTTPException(status_code=404, detail="Contact request not found")

    is_seller = (req["seller_id"] == current_user["id"])
    is_buyer = (req["buyer_id"] == current_user["id"])
    is_admin = (current_user.get("role") == "admin")

    if payload.action in ["approve", "decline"] and not (is_seller or is_admin):
        raise HTTPException(status_code=403, detail="Only the listing seller can accept or decline requests")

    if payload.action == "revoke" and not (is_seller or is_buyer or is_admin):
        raise HTTPException(status_code=403, detail="Not authorized to revoke this request")

    now = datetime.now(timezone.utc)
    target_status = "approved" if payload.action == "approve" else ("declined" if payload.action == "decline" else "revoked")
    req["status"] = target_status
    req["responded_at"] = now.isoformat()
    req["updated_at"] = now.isoformat()

    listing = next((l for l in db.listings if l["id"] == req["listing_id"]), None)
    listing_title = listing["title"] if listing else "Listing"
    buyer = next((p for p in db.profiles if p["id"] == req["buyer_id"]), None)
    seller = next((p for p in db.profiles if p["id"] == req["seller_id"]), None)

    # Audit log
    db.audit_logs.append({
        "id": str(uuid.uuid4()),
        "actor_id": current_user["id"],
        "action": f"contact_{payload.action}d",
        "target_type": "contact_request",
        "target_id": request_id,
        "details": {"listing_id": req["listing_id"], "buyer_id": req["buyer_id"], "new_status": target_status},
        "created_at": now.isoformat()
    })

    if payload.action == "approve":
        # Decrypt contact details
        c_record = next((c for c in db.contact_details if c["listing_id"] == req["listing_id"]), None)
        decrypted_val = ""
        c_type = "email"
        c_note = None
        if c_record:
            try:
                decrypted_val = decrypt_contact(c_record["encrypted_contact_value"])
                c_type = c_record["contact_type"]
                c_note = c_record.get("preferred_note")
            except Exception:
                pass

        # Push real-time WebSocket event to buyer
        await ws_manager.send_personal_event(
            user_id=req["buyer_id"],
            event_type="contact_request_approved",
            payload={
                "request_id": request_id,
                "listing_id": req["listing_id"],
                "listing_title": listing_title,
                "seller_name": seller["display_name"] if seller else "Seller",
                "contact_type": c_type,
                "contact_value": decrypted_val,
                "preferred_note": c_note,
                "responded_at": now.isoformat()
            }
        )

        # Resend Email to buyer
        if buyer:
            email_service.notify_buyer_request_approved(
                buyer_email=buyer["email"],
                buyer_name=buyer["display_name"],
                seller_name=seller["display_name"] if seller else "Seller",
                listing_title=listing_title,
                contact_type=c_type,
                contact_value=decrypted_val,
                preferred_note=c_note
            )

    elif payload.action == "decline":
        await ws_manager.send_personal_event(
            user_id=req["buyer_id"],
            event_type="contact_request_declined",
            payload={"request_id": request_id, "listing_title": listing_title}
        )
        if buyer:
            email_service.notify_buyer_request_declined(
                buyer_email=buyer["email"],
                buyer_name=buyer["display_name"],
                listing_title=listing_title
            )

    elif payload.action == "revoke":
        await ws_manager.send_personal_event(
            user_id=req["buyer_id"],
            event_type="contact_access_revoked",
            payload={"request_id": request_id, "listing_title": listing_title}
        )

    return _format_contact_request(req, current_user["id"])
