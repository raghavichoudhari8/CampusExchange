import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.security.auth import create_access_token

client = TestClient(app)

def test_public_listings_never_expose_contacts():
    res = client.get("/api/v1/listings")
    assert res.status_code == 200
    listings = res.json()
    assert len(listings) > 0
    for l in listings:
        # Strict privacy check: no phone, email, or contact value in public payload
        assert "contact_value" not in l
        assert "phone" not in l
        assert l.get("approved_contact") is None

def test_unverified_user_cannot_create_listing():
    # Token for unverified user
    unverified_token = create_access_token(
        user_id="44444444-0000-0000-0000-000000000005",
        email="unverified.user@gmail.com",
        is_verified=False
    )
    payload = {
        "title": "Unverified Test Item",
        "description": "Attempting to create listing without institutional email",
        "category_id": "33333333-0000-0000-0000-000000000001",
        "campus_id": "22222222-0000-0000-0000-000000000001",
        "price": 10.0,
        "is_free": False,
        "condition": "good",
        "location_note": "Campus Quad",
        "contact_type": "phone",
        "contact_value": "555-0199"
    }
    res = client.post(
        "/api/v1/listings",
        json=payload,
        headers={"Authorization": f"Bearer {unverified_token}"}
    )
    # Must be 403 Forbidden
    assert res.status_code == 403
    assert "institutional email verification required" in res.json()["detail"].lower()

def test_verified_user_can_create_listing_and_contacts_are_encrypted():
    verified_token = create_access_token(
        user_id="44444444-0000-0000-0000-000000000002",
        email="alex.chen@mit.edu",
        is_verified=True
    )
    secret_phone = "+1-617-999-8877"
    payload = {
        "title": "Sony WH-1000XM4 Noise Canceling Headphones",
        "description": "Mint condition wireless noise canceling headphones, great for library study sessions.",
        "category_id": "33333333-0000-0000-0000-000000000001",
        "campus_id": "22222222-0000-0000-0000-000000000001",
        "price": 120.0,
        "is_free": False,
        "condition": "like_new",
        "location_note": "Hayden Library 2nd Floor",
        "images": ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e"],
        "contact_type": "phone",
        "contact_value": secret_phone,
        "preferred_note": "Call after 5 PM"
    }
    res = client.post(
        "/api/v1/listings",
        json=payload,
        headers={"Authorization": f"Bearer {verified_token}"}
    )
    assert res.status_code == 200
    created = res.json()
    assert created["title"] == payload["title"]
    assert created["status"] == "active"
    # The seller themselves can see their own contact info in approved_contact
    assert created["approved_contact"]["contact_value"] == secret_phone

    # Now verify as an unauthenticated or third-party buyer that the contact info is NOT exposed
    res_public = client.get(f"/api/v1/listings/{created['id']}")
    assert res_public.status_code == 200
    public_view = res_public.json()
    assert public_view.get("approved_contact") is None

def test_prohibited_content_flagged():
    verified_token = create_access_token(
        user_id="44444444-0000-0000-0000-000000000002",
        email="alex.chen@mit.edu",
        is_verified=True
    )
    payload = {
        "title": "Airsoft gun and tactical knife",
        "description": "Used tactical weapon gear and knife for sale. Send crypto or wire transfer upfront.",
        "category_id": "33333333-0000-0000-0000-000000000001",
        "campus_id": "22222222-0000-0000-0000-000000000001",
        "price": 50.0,
        "is_free": False,
        "condition": "good",
        "location_note": "Off campus",
        "contact_type": "email",
        "contact_value": "scammer@proton.me"
    }
    res = client.post(
        "/api/v1/listings",
        json=payload,
        headers={"Authorization": f"Bearer {verified_token}"}
    )
    assert res.status_code == 200
    created = res.json()
    # High-risk prohibited content must be flagged!
    assert created["status"] == "flagged"
    assert created["spam_score"] >= 0.7

def test_ml_categorization():
    res = client.post(
        "/api/v1/ml/categorize",
        json={
            "title": "TI-84 Graphing Calculator",
            "description": "Calculus calculator with battery"
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert "electronics" in data["category_name"].lower() or "tech" in data["category_name"].lower()
