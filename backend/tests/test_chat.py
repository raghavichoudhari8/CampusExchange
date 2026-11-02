import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import db
from app.security.auth import create_access_token

import uuid

client = TestClient(app)

def test_chat_flow_end_to_end():
    seller_id = "44444444-0000-0000-0000-000000000002" # Alex Chen
    buyer_id = "44444444-0000-0000-0000-000000000003"  # Priya Sharma
    third_party_id = "44444444-0000-0000-0000-000000000004" # Marcus

    seller_token = create_access_token(seller_id, "alex.chen@mit.edu", is_verified=True)
    buyer_token = create_access_token(buyer_id, "priya.sharma@iitb.ac.in", is_verified=True)
    third_party_token = create_access_token(third_party_id, "marcus.v@stanford.edu", is_verified=True)

    # Use unique test listing to guarantee isolated chat conversation history
    listing_id = str(uuid.uuid4())
    db.listings.append({
        "id": listing_id,
        "seller_id": seller_id,
        "user_id": seller_id,
        "title": "TI-84 Plus Graphing Calculator",
        "price": 2500.0,
        "is_free": False,
        "status": "active",
        "location_note": "PICT Library Desk",
        "campus_id": "11111111-0000-0000-0000-000000000001",
        "category_id": "33333333-0000-0000-0000-000000000001",
        "created_at": "2026-10-24T12:00:00Z"
    })

    # 1. Unauthenticated cannot start conversation
    res_unauth = client.post("/api/v1/chat/conversations", json={"listing_id": listing_id})
    assert res_unauth.status_code == 401

    # 2. Seller cannot chat with self
    res_self = client.post(
        "/api/v1/chat/conversations",
        json={"listing_id": listing_id},
        headers={"Authorization": f"Bearer {seller_token}"}
    )
    assert res_self.status_code == 400

    # 3. Buyer starts conversation
    res_start = client.post(
        "/api/v1/chat/conversations",
        json={
            "listing_id": listing_id,
            "initial_message": "Hi! Can we meet at the PICT Central Library?"
        },
        headers={"Authorization": f"Bearer {buyer_token}"}
    )
    assert res_start.status_code == 200
    conv_data = res_start.json()
    assert conv_data["listing"]["id"] == listing_id
    assert conv_data["other_user"]["id"] == seller_id
    assert conv_data["last_message"]["content"] == "Hi! Can we meet at the PICT Central Library?"
    conv_id = conv_data["id"]

    # 4. Seller fetches their conversations and sees this active chat
    res_seller_convs = client.get(
        "/api/v1/chat/conversations",
        headers={"Authorization": f"Bearer {seller_token}"}
    )
    assert res_seller_convs.status_code == 200
    seller_convs = res_seller_convs.json()
    assert any(c["id"] == conv_id for c in seller_convs)

    # 5. Seller replies to buyer
    res_reply = client.post(
        f"/api/v1/chat/conversations/{conv_id}/messages",
        json={"content": "Sure, I am free at 4 PM near the front desk."},
        headers={"Authorization": f"Bearer {seller_token}"}
    )
    assert res_reply.status_code == 200
    reply_data = res_reply.json()
    assert reply_data["content"] == "Sure, I am free at 4 PM near the front desk."
    assert reply_data["sender_id"] == seller_id
    assert reply_data["recipient_id"] == buyer_id

    # 6. Buyer fetches messages in conversation
    res_msgs = client.get(
        f"/api/v1/chat/conversations/{conv_id}/messages",
        headers={"Authorization": f"Bearer {buyer_token}"}
    )
    assert res_msgs.status_code == 200
    msgs = res_msgs.json()
    assert len(msgs) == 2
    assert msgs[0]["content"] == "Hi! Can we meet at the PICT Central Library?"
    assert msgs[1]["content"] == "Sure, I am free at 4 PM near the front desk."

    # 7. Third-party is blocked with 403
    res_blocked = client.get(
        f"/api/v1/chat/conversations/{conv_id}/messages",
        headers={"Authorization": f"Bearer {third_party_token}"}
    )
    assert res_blocked.status_code == 403
