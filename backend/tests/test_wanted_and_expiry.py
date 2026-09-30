import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.database import db
from app.security.auth import create_access_token
from app.services.expiry_job import run_expiry_scan

client = TestClient(app)

def test_wanted_posts_flow():
    verified_token = create_access_token(
        user_id="44444444-0000-0000-0000-000000000003", # Priya Sharma
        email="priya.sharma@iitb.ac.in",
        is_verified=True
    )
    # 1. Create a wanted item
    payload = {
        "title": "Need TI-84 or Casio FX-991EX Calculator",
        "description": "Midterms approaching next week. Needed urgently for 2 weeks or to purchase.",
        "category_id": "33333333-0000-0000-0000-000000000001",
        "campus_id": "22222222-0000-0000-0000-000000000002",
        "budget_max": 25.0
    }
    res = client.post(
        "/api/v1/wanted",
        json=payload,
        headers={"Authorization": f"Bearer {verified_token}"}
    )
    assert res.status_code == 200
    created = res.json()
    assert created["title"] == payload["title"]
    assert created["status"] == "open"
    assert created["user_name"] == "Priya Sharma"

    # 2. List wanted items
    res_list = client.get("/api/v1/wanted")
    assert res_list.status_code == 200
    all_wanted = res_list.json()
    assert any(w["id"] == created["id"] for w in all_wanted)

def test_listing_expiry_scan():
    # Insert a listing that expired yesterday
    now = datetime.now(timezone.utc)
    expired_listing = {
        "id": "99999999-0000-0000-0000-000000000099",
        "seller_id": "44444444-0000-0000-0000-000000000002",
        "campus_id": "22222222-0000-0000-0000-000000000001",
        "category_id": "33333333-0000-0000-0000-000000000001",
        "title": "Old Expired Textbook",
        "description": "Past 30 days old item",
        "price": 5.0,
        "is_free": False,
        "condition": "fair",
        "location_note": "Library",
        "status": "active",
        "spam_score": 0.0,
        "view_count": 5,
        "expires_at": (now - timedelta(days=1)).isoformat(),
        "created_at": (now - timedelta(days=31)).isoformat(),
        "updated_at": (now - timedelta(days=31)).isoformat()
    }
    db.listings.append(expired_listing)

    # Run expiry scan
    res_scan = run_expiry_scan()
    assert res_scan["status"] == "completed"
    assert res_scan["expired_listings"] >= 1

    # Verify listing is now expired
    assert expired_listing["status"] == "expired"
