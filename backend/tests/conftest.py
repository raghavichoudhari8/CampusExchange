import pytest
from datetime import datetime, timezone, timedelta
from app.database import db
from app.security.encryption import encrypt_contact

@pytest.fixture(autouse=True)
def setup_test_db():
    """Seeds test fixtures for isolated backend unit tests."""
    now = datetime.now(timezone.utc)
    
    # 1. Profiles for tests
    db.profiles = [
        {
            "id": "44444444-0000-0000-0000-000000000001",
            "email": "admin@campusswap.edu",
            "domain": "campusswap.edu",
            "is_verified": True,
            "display_name": "Campus Admin",
            "campus_id": "22222222-0000-0000-0000-000000000005",
            "hostel_building": "Administration Tower",
            "batch_year": 2023,
            "role": "admin",
            "is_banned": False,
            "avg_response_time_minutes": 5,
            "avatar_url": None,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        },
        {
            "id": "44444444-0000-0000-0000-000000000002",
            "email": "alex.chen@mit.edu",
            "domain": "mit.edu",
            "is_verified": True,
            "display_name": "Alex Chen",
            "campus_id": "22222222-0000-0000-0000-000000000005",
            "hostel_building": "Hostel 4 - Next House",
            "batch_year": 2025,
            "role": "student",
            "is_banned": False,
            "avg_response_time_minutes": 15,
            "avatar_url": None,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        },
        {
            "id": "44444444-0000-0000-0000-000000000003",
            "email": "priya.sharma@iitb.ac.in",
            "domain": "iitb.ac.in",
            "is_verified": True,
            "display_name": "Priya Sharma",
            "campus_id": "22222222-0000-0000-0000-000000000005",
            "hostel_building": "Hostel 12 - Wing B",
            "batch_year": 2026,
            "role": "student",
            "is_banned": False,
            "avg_response_time_minutes": 25,
            "avatar_url": None,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        },
        {
            "id": "44444444-0000-0000-0000-000000000004",
            "email": "marcus.v@stanford.edu",
            "domain": "stanford.edu",
            "is_verified": True,
            "display_name": "Marcus Vance",
            "campus_id": "22222222-0000-0000-0000-000000000005",
            "hostel_building": "Roble Hall",
            "batch_year": 2024,
            "role": "student",
            "is_banned": False,
            "avg_response_time_minutes": 40,
            "avatar_url": None,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        },
        {
            "id": "44444444-0000-0000-0000-000000000005",
            "email": "unverified.user@gmail.com",
            "domain": "gmail.com",
            "is_verified": False,
            "display_name": "Guest User",
            "campus_id": None,
            "hostel_building": None,
            "batch_year": None,
            "role": "student",
            "is_banned": False,
            "avg_response_time_minutes": None,
            "avatar_url": None,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        },
    ]

    # 2. Test Listings
    db.listings = [
        {
            "id": "55555555-0000-0000-0000-000000000001",
            "seller_id": "44444444-0000-0000-0000-000000000002",
            "campus_id": "22222222-0000-0000-0000-000000000005",
            "category_id": "33333333-0000-0000-0000-000000000001",
            "title": "TI-84 Plus CE Color Graphing Calculator",
            "description": "Used for AP Calculus and Linear Algebra. Pristine condition with charging cable and sliding hard case.",
            "price": 1800.0,
            "is_free": False,
            "condition": "like_new",
            "location_note": "PICT Central Library Lobby",
            "status": "active",
            "spam_score": 0.02,
            "view_count": 24,
            "expires_at": (now + timedelta(days=28)).isoformat(),
            "created_at": (now - timedelta(days=2)).isoformat(),
            "updated_at": (now - timedelta(days=2)).isoformat()
        }
    ]

    # 3. Test Images
    db.listing_images = [
        {
            "id": "66666666-0000-0000-0000-000000000001",
            "listing_id": "55555555-0000-0000-0000-000000000001",
            "image_url": "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80",
            "sort_order": 0
        }
    ]

    # 4. Test Contact
    enc_phone = encrypt_contact("+1-617-555-0192")
    db.contact_details = [
        {
            "id": "88888888-0000-0000-0000-000000000001",
            "listing_id": "55555555-0000-0000-0000-000000000001",
            "user_id": "44444444-0000-0000-0000-000000000002",
            "contact_type": "phone",
            "encrypted_contact_value": enc_phone,
            "preferred_note": "Text me on WhatsApp or SMS between 2 PM and 8 PM",
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }
    ]

    # 5. Test Wanted Posts
    db.wanted_posts = [
        {
            "id": "77777777-0000-0000-0000-000000000001",
            "user_id": "44444444-0000-0000-0000-000000000003",
            "campus_id": "22222222-0000-0000-0000-000000000005",
            "category_id": "33333333-0000-0000-0000-000000000001",
            "title": "Looking for Dell or Lenovo 65W USB-C Laptop Charger",
            "description": "Left my laptop charger at home during fall break.",
            "budget_max": 750.0,
            "status": "open",
            "created_at": (now - timedelta(days=2)).isoformat(),
            "updated_at": (now - timedelta(days=2)).isoformat()
        }
    ]

    db.contact_requests = []
    yield
