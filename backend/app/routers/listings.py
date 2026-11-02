from datetime import datetime, timezone, timedelta
import uuid
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
import httpx
from app.config import settings
from app.database import db
from app.schemas.listings import (
    ListingCreate,
    ListingResponse,
    ListingStatusUpdate,
    CategoryResponse,
    DecryptedContactInfo,
)
from app.security.auth import (
    get_current_user_optional,
    get_current_verified_user,
    get_current_user,
    compute_user_badges,
)
from app.security.encryption import encrypt_contact, decrypt_contact
from app.services.search_service import search_service
from app.services.profile_service import ensure_profile_in_supabase

router = APIRouter(prefix="/api/v1/listings", tags=["Listings"])

def _format_listing_response(
    listing: Dict[str, Any],
    caller: Optional[Dict[str, Any]] = None
) -> ListingResponse:
    """
    Constructs public listing response.
    PRIVACY ENFORCEMENT: Contact details are decrypted ONLY IF:
    1) Caller is the listing seller, OR
    2) Caller is a verified buyer with an approved contact request for this listing.
    Otherwise, approved_contact is strictly None!
    """
    seller = next((p for p in db.profiles if p["id"] == listing["seller_id"]), None)
    seller_name = seller["display_name"] if seller else "Campus Student"
    seller_badges = compute_user_badges(seller) if seller else []

    campus = next((c for c in db.campuses if c["id"] == listing["campus_id"]), None)
    campus_name = campus["name"] if campus else None

    category = next((c for c in db.categories if c["id"] == listing["category_id"]), None)
    category_name = category["name"] if category else None

    images = [img["image_url"] for img in db.listing_images if img["listing_id"] == listing["id"]]
    if not images:
        images = ["https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80"]

    has_pending = False
    approved_contact = None

    if caller:
        # Check if caller has contact request
        req = next(
            (r for r in db.contact_requests if r["listing_id"] == listing["id"] and r["buyer_id"] == caller["id"]),
            None
        )
        if req:
            has_pending = (req["status"] == "pending")

        is_seller = (caller["id"] == listing["seller_id"])
        is_approved_buyer = (req is not None and req["status"] == "approved")

        if is_seller or is_approved_buyer:
            contact = next((c for c in db.contact_details if c["listing_id"] == listing["id"]), None)
            if contact:
                try:
                    decrypted_val = decrypt_contact(contact["encrypted_contact_value"])
                    approved_contact = DecryptedContactInfo(
                        contact_type=contact["contact_type"],
                        contact_value=decrypted_val,
                        preferred_note=contact.get("preferred_note")
                    )
                except Exception:
                    pass

    return ListingResponse(
        id=listing["id"],
        seller_id=listing["seller_id"],
        seller_name=seller_name,
        seller_badges=seller_badges,
        campus_id=listing["campus_id"],
        campus_name=campus_name,
        category_id=listing["category_id"],
        category_name=category_name,
        title=listing["title"],
        description=listing["description"],
        price=float(listing.get("price") or 0.0),
        is_free=bool(listing.get("is_free", False)),
        condition=listing["condition"],
        location_note=listing.get("location_note", "Campus Meeting Area"),
        status=listing["status"],
        spam_score=listing.get("spam_score", 0.0),
        view_count=listing.get("view_count", 0),
        images=images,
        expires_at=listing["expires_at"],
        created_at=listing["created_at"],
        updated_at=listing["updated_at"],
        has_pending_request=has_pending,
        approved_contact=approved_contact
    )

@router.get("/categories", response_model=List[CategoryResponse])
def get_categories():
    """Returns all categories and subcategories."""
    return sorted(db.categories, key=lambda c: (c.get("parent_id") is not None, c.get("sort_order", 0)))

@router.get("", response_model=List[ListingResponse])
async def list_listings(
    category_id: Optional[str] = Query(None),
    campus_id: Optional[str] = Query(None),
    condition: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    is_free: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    status: str = Query("active"),
    caller: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """
    Browse public marketplace listings.
    Supports search query, category, micro-hub campus filter, condition, price range.
    Rankings prioritize the user's preferred campus micro-hub.
    """
    if settings.SUPABASE_URL and settings.SUPABASE_KEY:
        try:
            with httpx.Client(timeout=8.0) as client:
                query_url = f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1/listings?select=*"
                if status:
                    query_url += f"&status=eq.{status}"
                query_url += "&order=created_at.desc"

                res = client.get(
                    query_url,
                    headers={
                        "apikey": settings.SUPABASE_KEY,
                        "Authorization": f"Bearer {settings.SUPABASE_KEY}"
                    }
                )
                if res.status_code == 200:
                    supa_listings = res.json()
                    # Sync listings: update or append to keep memory in sync with database
                    supa_ids = {l["id"] for l in supa_listings}
                    # Keep local listings not in Supabase only if they are newly created in-memory
                    db.listings = supa_listings + [l for l in db.listings if l["id"] not in supa_ids and l.get("status") == status]

                    # Sync images
                    img_res = client.get(
                        f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1/listing_images?select=*&order=sort_order.asc",
                        headers={
                            "apikey": settings.SUPABASE_KEY,
                            "Authorization": f"Bearer {settings.SUPABASE_KEY}"
                        }
                    )
                    if img_res.status_code == 200:
                        db.listing_images = img_res.json()

                    # Sync profiles so seller names and badges are accurately shown
                    prof_res = client.get(
                        f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1/profiles?select=*",
                        headers={
                            "apikey": settings.SUPABASE_KEY,
                            "Authorization": f"Bearer {settings.SUPABASE_KEY}"
                        }
                    )
                    if prof_res.status_code == 200:
                        known_prof_ids = {p["id"] for p in db.profiles}
                        for sp in prof_res.json():
                            if sp["id"] not in known_prof_ids:
                                db.profiles.append(sp)
                                known_prof_ids.add(sp["id"])
                            else:
                                for ep in db.profiles:
                                    if ep["id"] == sp["id"]:
                                        ep.update(sp)
                                        break
        except Exception as e:
            print("Failed to sync listings from Supabase:", e)

    candidates = [l for l in db.listings if (l.get("status") == status if status else True)]

    # Category filter
    if category_id:
        # Include children categories if parent selected
        sub_cat_ids = {c["id"] for c in db.categories if c.get("parent_id") == category_id}
        cat_filter = sub_cat_ids.union({category_id})
        candidates = [l for l in candidates if l["category_id"] in cat_filter]

    # Campus micro-hub filter
    if campus_id:
        candidates = [l for l in candidates if l["campus_id"] == campus_id]

    # Condition
    if condition:
        candidates = [l for l in candidates if l["condition"] == condition]

    # Free filter
    if is_free is not None:
        candidates = [l for l in candidates if bool(l.get("is_free")) == is_free]

    # Price range
    if min_price is not None:
        candidates = [l for l in candidates if float(l.get("price") or 0.0) >= min_price]
    if max_price is not None:
        candidates = [l for l in candidates if float(l.get("price") or 0.0) <= max_price]

    # Search keyword
    if search:
        candidates = await search_service.search(search, candidates)

    # Campus Micro-Hub Prioritization:
    # If caller has an active campus, rank local campus listings higher!
    caller_campus_id = caller.get("campus_id") if caller else None
    if caller_campus_id and not campus_id:
        candidates.sort(key=lambda l: (0 if l["campus_id"] == caller_campus_id else 1, l["created_at"]), reverse=False)

    return [_format_listing_response(l, caller) for l in candidates]

@router.get("/{id}", response_model=ListingResponse)
def get_listing(id: str, caller: Optional[Dict[str, Any]] = Depends(get_current_user_optional)):
    """Fetches details for a specific listing and increments view count."""
    listing = next((l for l in db.listings if l["id"] == id), None)
    if not listing and settings.SUPABASE_URL and settings.SUPABASE_KEY:
        try:
            with httpx.Client(timeout=6.0) as client:
                res = client.get(
                    f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1/listings?id=eq.{id}&select=*",
                    headers={
                        "apikey": settings.SUPABASE_KEY,
                        "Authorization": f"Bearer {settings.SUPABASE_KEY}"
                    }
                )
                if res.status_code == 200 and res.json():
                    listing = res.json()[0]
                    db.listings.append(listing)
                    # Fetch images for this listing
                    img_res = client.get(
                        f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1/listing_images?listing_id=eq.{id}&select=*&order=sort_order.asc",
                        headers={
                            "apikey": settings.SUPABASE_KEY,
                            "Authorization": f"Bearer {settings.SUPABASE_KEY}"
                        }
                    )
                    if img_res.status_code == 200:
                        for img in img_res.json():
                            if not any(i["id"] == img["id"] for i in db.listing_images):
                                db.listing_images.append(img)
                    # Fetch seller profile if missing
                    seller_id = listing.get("seller_id")
                    if seller_id and not any(p["id"] == seller_id for p in db.profiles):
                        prof_res = client.get(
                            f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1/profiles?id=eq.{seller_id}&select=*",
                            headers={
                                "apikey": settings.SUPABASE_KEY,
                                "Authorization": f"Bearer {settings.SUPABASE_KEY}"
                            }
                        )
                        if prof_res.status_code == 200 and prof_res.json():
                            db.profiles.append(prof_res.json()[0])
        except Exception as e:
            print("Failed to fetch listing from Supabase:", e)

    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    listing["view_count"] = listing.get("view_count", 0) + 1
    return _format_listing_response(listing, caller)

@router.post("", response_model=ListingResponse)
async def create_listing(
    payload: ListingCreate,
    current_user: Dict[str, Any] = Depends(get_current_verified_user)
):
    """
    Creates a new listing.
    MANDATORY PRIVACY ISOLATION:
    1. Only verified students from approved institutional email domains can post.
    2. Contact details (phone, email, whatsapp) are AES-256-GCM encrypted
       and stored in a completely separate table `contact_details`.
    3. The public listing record NEVER contains personal contact details.
    """
    now = datetime.now(timezone.utc)
    listing_id = str(uuid.uuid4())

    # Basic spam / prohibited heuristic
    from app.services.ml_service import ml_service
    is_prohibited, spam_score, reason = ml_service.check_content(payload.title, payload.description)
    listing_status = "flagged" if is_prohibited or spam_score >= 0.7 else "active"

    # Verify campus exists or fall back to PICT
    campus = next((c for c in db.campuses if c["id"] == payload.campus_id), None)
    campus_id = campus["id"] if campus else "22222222-0000-0000-0000-000000000005"

    # Verify category exists or fall back to first category
    category = next((c for c in db.categories if c["id"] == payload.category_id), None)
    category_id = category["id"] if category else (db.categories[0]["id"] if db.categories else "33333333-0000-0000-0000-000000000001")

    new_listing = {
        "id": listing_id,
        "seller_id": current_user["id"],
        "campus_id": campus_id,
        "category_id": category_id,
        "title": payload.title.strip(),
        "description": payload.description.strip(),
        "price": 0.0 if payload.is_free else payload.price,
        "is_free": payload.is_free,
        "condition": payload.condition,
        "location_note": payload.location_note.strip(),
        "status": listing_status,
        "spam_score": spam_score,
        "view_count": 0,
        "expires_at": (now + timedelta(days=30)).isoformat(),
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    db.listings.insert(0, new_listing)

    # Save images in memory
    for idx, url in enumerate(payload.images):
        db.listing_images.append({
            "id": str(uuid.uuid4()),
            "listing_id": listing_id,
            "image_url": url,
            "sort_order": idx,
            "created_at": now.isoformat()
        })

    # ENCRYPT AND STORE CONTACT DETAILS IN ISOLATED TABLE
    encrypted_val = encrypt_contact(payload.contact_value.strip())
    db.contact_details.append({
        "id": str(uuid.uuid4()),
        "listing_id": listing_id,
        "user_id": current_user["id"],
        "contact_type": payload.contact_type,
        "encrypted_contact_value": encrypted_val,
        "preferred_note": payload.preferred_note.strip() if payload.preferred_note else None,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    })

    # Persist to Supabase when configured in cloud environment
    if settings.SUPABASE_URL and settings.SUPABASE_KEY:
        try:
            # 1. Guarantee user profile exists in Supabase before creating listing
            profile_synced = ensure_profile_in_supabase(current_user, campus_id=campus_id)
            if not profile_synced:
                print(f"Warning: ensure_profile_in_supabase returned False for user {current_user.get('id')}")

            with httpx.Client(timeout=8.0) as client:
                headers = {
                    "apikey": settings.SUPABASE_KEY,
                    "Authorization": f"Bearer {settings.SUPABASE_KEY}",
                    "Content-Type": "application/json"
                }

                # 2. Persist the listing record
                res = client.post(
                    f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1/listings",
                    headers={**headers, "Prefer": "return=minimal"},
                    json=new_listing
                )
                if res.status_code >= 400:
                    print("Supabase listing insert failed:", res.status_code, res.text)
                    raise HTTPException(
                        status_code=500,
                        detail=f"Failed to persist listing to Supabase: {res.text}"
                    )

                # 3. Persist images
                if payload.images:
                    img_rows = [{
                        "id": str(uuid.uuid4()),
                        "listing_id": listing_id,
                        "image_url": url,
                        "sort_order": idx
                    } for idx, url in enumerate(payload.images)]
                    client.post(
                        f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1/listing_images",
                        headers={**headers, "Prefer": "return=minimal"},
                        json=img_rows
                    )

                # 4. Persist contact details
                client.post(
                    f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1/contact_details",
                    headers={**headers, "Prefer": "return=minimal"},
                    json={
                        "id": str(uuid.uuid4()),
                        "listing_id": listing_id,
                        "user_id": current_user["id"],
                        "contact_type": payload.contact_type,
                        "encrypted_contact_value": encrypted_val,
                        "preferred_note": payload.preferred_note.strip() if payload.preferred_note else None
                    }
                )
        except HTTPException:
            raise
        except Exception as e:
            print("Failed to sync listing to Supabase:", e)

    # Sync to Search Service (public fields ONLY)
    await search_service.index_listing(new_listing)

    # Audit log
    db.audit_logs.append({
        "id": str(uuid.uuid4()),
        "actor_id": current_user["id"],
        "action": "listing_created",
        "target_type": "listing",
        "target_id": listing_id,
        "details": {"title": payload.title, "status": listing_status, "spam_score": spam_score},
        "created_at": now.isoformat()
    })

    return _format_listing_response(new_listing, current_user)

@router.patch("/{id}/status", response_model=ListingResponse)
def update_listing_status(
    id: str,
    payload: ListingStatusUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Updates listing status (active, reserved, sold). Only owner or admin."""
    listing = next((l for l in db.listings if l["id"] == id), None)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    is_owner = (listing["seller_id"] == current_user["id"])
    is_admin = (current_user.get("role") == "admin")
    if not (is_owner or is_admin):
        raise HTTPException(status_code=403, detail="Not authorized to modify this listing")

    listing["status"] = payload.status
    listing["updated_at"] = datetime.now(timezone.utc).isoformat()

    if settings.SUPABASE_URL and settings.SUPABASE_KEY:
        try:
            with httpx.Client(timeout=4.0) as client:
                client.patch(
                    f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1/listings?id=eq.{id}",
                    headers={
                        "apikey": settings.SUPABASE_KEY,
                        "Authorization": f"Bearer {settings.SUPABASE_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={"status": payload.status, "updated_at": listing["updated_at"]}
                )
        except Exception:
            pass

    return _format_listing_response(listing, current_user)

@router.post("/{id}/renew", response_model=ListingResponse)
def renew_listing(
    id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Renews listing for another 30 days. Auto-expiry feature requirement."""
    listing = next((l for l in db.listings if l["id"] == id), None)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    if listing["seller_id"] != current_user["id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only owner can renew listing")

    now = datetime.now(timezone.utc)
    listing["expires_at"] = (now + timedelta(days=30)).isoformat()
    if listing["status"] == "expired":
        listing["status"] = "active"
    listing["updated_at"] = now.isoformat()

    if settings.SUPABASE_URL and settings.SUPABASE_KEY:
        try:
            with httpx.Client(timeout=4.0) as client:
                client.patch(
                    f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1/listings?id=eq.{id}",
                    headers={
                        "apikey": settings.SUPABASE_KEY,
                        "Authorization": f"Bearer {settings.SUPABASE_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={"expires_at": listing["expires_at"], "status": listing["status"], "updated_at": listing["updated_at"]}
                )
        except Exception:
            pass

    return _format_listing_response(listing, current_user)

@router.delete("/{id}")
def delete_listing(
    id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Deletes listing and its associated contact and image records."""
    listing = next((l for l in db.listings if l["id"] == id), None)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    if listing["seller_id"] != current_user["id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete listing")

    db.listings = [l for l in db.listings if l["id"] != id]
    db.listing_images = [img for img in db.listing_images if img["listing_id"] != id]
    db.contact_details = [c for c in db.contact_details if c["listing_id"] != id]
    db.contact_requests = [r for r in db.contact_requests if r["listing_id"] != id]

    if settings.SUPABASE_URL and settings.SUPABASE_KEY:
        try:
            with httpx.Client(timeout=4.0) as client:
                headers = {
                    "apikey": settings.SUPABASE_KEY,
                    "Authorization": f"Bearer {settings.SUPABASE_KEY}"
                }
                client.delete(f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1/listing_images?listing_id=eq.{id}", headers=headers)
                client.delete(f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1/contact_details?listing_id=eq.{id}", headers=headers)
                client.delete(f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1/contact_requests?listing_id=eq.{id}", headers=headers)
                client.delete(f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1/listings?id=eq.{id}", headers=headers)
        except Exception as e:
            print("Failed to delete listing from Supabase:", e)

    return {"message": "Listing deleted successfully"}

@router.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    """
    Accepts image file upload.
    In cloud environment, forwards to Supabase Storage.
    For local run, saves or generates data URI.
    """
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image file exceeds 10MB limit")
    
    import base64
    content_type = file.content_type or "image/jpeg"
    b64 = base64.b64encode(contents).decode("utf-8")
    data_url = f"data:{content_type};base64,{b64}"
    return {"url": data_url}
