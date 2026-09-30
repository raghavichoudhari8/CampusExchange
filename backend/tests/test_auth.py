import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.security.auth import check_domain_whitelist

client = TestClient(app)

def test_domain_whitelist_matching():
    # US .edu
    allowed, domain, college = check_domain_whitelist("student@mit.edu")
    assert allowed is True
    assert domain == "mit.edu"

    # Indian .ac.in
    allowed, domain, college = check_domain_whitelist("rahul@iitb.ac.in")
    assert allowed is True

    # Generic unverified provider
    allowed, domain, college = check_domain_whitelist("scammer@gmail.com")
    assert allowed is False
    assert domain == "gmail.com"

    # Yahoo
    allowed, domain, college = check_domain_whitelist("buyer@yahoo.com")
    assert allowed is False

def test_check_domain_endpoint():
    res = client.post("/api/v1/auth/check-domain", json={"email": "alice@stanford.edu"})
    assert res.status_code == 200
    data = res.json()
    assert data["is_allowed"] is True
    assert data["domain"] == "stanford.edu"

    res_fail = client.post("/api/v1/auth/check-domain", json={"email": "attacker@fake.xyz"})
    assert res_fail.status_code == 200
    data_fail = res_fail.json()
    assert data_fail["is_allowed"] is False
    assert "not on the approved campus list" in data_fail["reason"]

def test_demo_login_and_me():
    # Login verified student
    res = client.post("/api/v1/auth/login-demo", json={"user_id_or_email": "alex.chen@mit.edu"})
    assert res.status_code == 200
    token_data = res.json()
    assert token_data["is_verified"] is True
    token = token_data["access_token"]

    # Call /me with token
    res_me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res_me.status_code == 200
    profile = res_me.json()
    assert profile["email"] == "alex.chen@mit.edu"
    assert "Verified Student" in profile["badges"]

def test_unverified_user_login():
    res = client.post("/api/v1/auth/login-demo", json={"user_id_or_email": "unverified.user@gmail.com"})
    assert res.status_code == 200
    token_data = res.json()
    assert token_data["is_verified"] is False
