import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import db
from app.security.auth import create_access_token

client = TestClient(app)

def test_contact_request_workflow_privacy():
    # Setup users
    seller_id = "44444444-0000-0000-0000-000000000002" # Alex Chen
    buyer_id = "44444444-0000-0000-0000-000000000003" # Priya Sharma
    unverified_id = "44444444-0000-0000-0000-000000000005" # Guest User

    seller_token = create_access_token(seller_id, "alex.chen@mit.edu", is_verified=True)
    buyer_token = create_access_token(buyer_id, "priya.sharma@iitb.ac.in", is_verified=True)
    unverified_token = create_access_token(unverified_id, "unverified.user@gmail.com", is_verified=False)

    listing_id = "55555555-0000-0000-0000-000000000001" # TI-84 calculator owned by Alex Chen

    # 1. Unverified user is rejected with 403
    res_unverified = client.post(
        "/api/v1/contacts/request",
        json={"listing_id": listing_id, "message": "Can I buy this?"},
        headers={"Authorization": f"Bearer {unverified_token}"}
    )
    assert res_unverified.status_code == 403

    # 2. Seller cannot request their own listing
    res_self = client.post(
        "/api/v1/contacts/request",
        json={"listing_id": listing_id},
        headers={"Authorization": f"Bearer {seller_token}"}
    )
    assert res_self.status_code == 400

    # 3. Verified buyer creates contact request
    res_req = client.post(
        "/api/v1/contacts/request",
        json={"listing_id": listing_id, "message": "Hi Alex! Meet at Barker Library?"},
        headers={"Authorization": f"Bearer {buyer_token}"}
    )
    assert res_req.status_code == 200
    req_data = res_req.json()
    assert req_data["status"] == "pending"
    request_id = req_data["id"]

    # BEFORE APPROVAL: Buyer cannot see seller contact
    assert req_data.get("contact_details") is None

    # Public listing detail as buyer also shows contact as None
    res_item = client.get(f"/api/v1/listings/{listing_id}", headers={"Authorization": f"Bearer {buyer_token}"})
    assert res_item.status_code == 200
    assert res_item.json()["has_pending_request"] is True
    assert res_item.json().get("approved_contact") is None

    # 4. Duplicate request rejected
    res_dup = client.post(
        "/api/v1/contacts/request",
        json={"listing_id": listing_id},
        headers={"Authorization": f"Bearer {buyer_token}"}
    )
    assert res_dup.status_code == 400

    # 5. Seller views incoming request in queue
    res_seller_queue = client.get("/api/v1/contacts/seller-requests", headers={"Authorization": f"Bearer {seller_token}"})
    assert res_seller_queue.status_code == 200
    incoming = res_seller_queue.json()
    assert any(r["id"] == request_id for r in incoming)

    # 6. Seller Approves the request
    res_approve = client.post(
        f"/api/v1/contacts/request/{request_id}/respond",
        json={"action": "approve"},
        headers={"Authorization": f"Bearer {seller_token}"}
    )
    assert res_approve.status_code == 200
    assert res_approve.json()["status"] == "approved"

    # 7. Now Buyer can view the decrypted contact details!
    res_buyer_requests = client.get("/api/v1/contacts/my-requests", headers={"Authorization": f"Bearer {buyer_token}"})
    assert res_buyer_requests.status_code == 200
    approved_req = next(r for r in res_buyer_requests.json() if r["id"] == request_id)
    assert approved_req["status"] == "approved"
    assert approved_req["contact_details"] is not None
    assert approved_req["contact_details"]["contact_value"] == "+1-617-555-0192"

    # Also listing detail now reveals approved contact for this buyer
    res_item_approved = client.get(f"/api/v1/listings/{listing_id}", headers={"Authorization": f"Bearer {buyer_token}"})
    assert res_item_approved.json()["approved_contact"]["contact_value"] == "+1-617-555-0192"

    # 8. Seller Revokes access
    res_revoke = client.post(
        f"/api/v1/contacts/request/{request_id}/respond",
        json={"action": "revoke"},
        headers={"Authorization": f"Bearer {seller_token}"}
    )
    assert res_revoke.status_code == 200
    assert res_revoke.json()["status"] == "revoked"

    # AFTER REVOCATION: Contact details are immediately removed from buyer view
    res_buyer_revoked = client.get("/api/v1/contacts/my-requests", headers={"Authorization": f"Bearer {buyer_token}"})
    revoked_req = next(r for r in res_buyer_revoked.json() if r["id"] == request_id)
    assert revoked_req["status"] == "revoked"
    assert revoked_req["contact_details"] is None

    # Check Audit Logs
    audit_actions = [log["action"] for log in db.audit_logs if log.get("target_id") == request_id]
    assert "contact_requested" in audit_actions
    assert "contact_approved" in audit_actions
    assert "contact_revoked" in audit_actions
