from datetime import datetime, timezone
import uuid
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from app.database import db
from app.schemas.wanted import WantedCreate, WantedResponse
from app.security.auth import get_current_verified_user, get_current_user, compute_user_badges

router = APIRouter(prefix="/api/v1/wanted", tags=["Wanted / Wishlist Board"])

def _format_wanted(post: Dict[str, Any]) -> WantedResponse:
    user = next((p for p in db.profiles if p["id"] == post["user_id"]), None)
    user_name = user["display_name"] if user else "Student"
    user_badges = compute_user_badges(user) if user else []

    campus = next((c for c in db.campuses if c["id"] == post["campus_id"]), None)
    campus_name = campus["name"] if campus else "Campus"

    category = next((c for c in db.categories if c["id"] == post["category_id"]), None)
    category_name = category["name"] if category else "General"

    return WantedResponse(
        id=post["id"],
        user_id=post["user_id"],
        user_name=user_name,
        user_badges=user_badges,
        campus_id=post["campus_id"],
        campus_name=campus_name,
        category_id=post["category_id"],
        category_name=category_name,
        title=post["title"],
        description=post["description"],
        budget_max=post.get("budget_max"),
        status=post["status"],
        created_at=post["created_at"]
    )

@router.get("", response_model=List[WantedResponse])
def get_wanted_posts(
    campus_id: Optional[str] = Query(None),
    category_id: Optional[str] = Query(None),
    status: str = Query("open")
):
    """Browse wanted item requests across campus micro-hubs."""
    posts = [p for p in db.wanted_posts if p.get("status") == status]
    if campus_id:
        posts = [p for p in posts if p["campus_id"] == campus_id]
    if category_id:
        posts = [p for p in posts if p["category_id"] == category_id]
    return [_format_wanted(p) for p in posts]

@router.post("", response_model=WantedResponse)
def create_wanted_post(
    payload: WantedCreate,
    current_user: Dict[str, Any] = Depends(get_current_verified_user)
):
    """
    Creates a new wanted item request.
    Only verified students can post wanted requests.
    """
    now = datetime.now(timezone.utc)
    new_post = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "campus_id": payload.campus_id,
        "category_id": payload.category_id,
        "title": payload.title.strip(),
        "description": payload.description.strip(),
        "budget_max": payload.budget_max,
        "status": "open",
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    db.wanted_posts.insert(0, new_post)
    return _format_wanted(new_post)

@router.patch("/{id}/status", response_model=WantedResponse)
def update_wanted_status(
    id: str,
    status: str = Query(..., pattern="^(open|fulfilled|cancelled)$"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Marks a wanted request as fulfilled or cancelled."""
    post = next((p for p in db.wanted_posts if p["id"] == id), None)
    if not post:
        raise HTTPException(status_code=404, detail="Wanted post not found")

    if post["user_id"] != current_user["id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to modify this post")

    post["status"] = status
    post["updated_at"] = datetime.now(timezone.utc).isoformat()
    return _format_wanted(post)
