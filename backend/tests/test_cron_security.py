import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

client = TestClient(app)

def test_cron_endpoint_unauthorized():
    # Calling without any credentials
    res = client.get("/api/v1/cron/expiry")
    assert res.status_code == 401
    assert "Invalid or missing CRON_SECRET" in res.json()["detail"]

def test_cron_endpoint_invalid_secret():
    # Calling with invalid bearer token
    res = client.get("/api/v1/cron/expiry", headers={"Authorization": "Bearer wrong-secret"})
    assert res.status_code == 401

    # Calling with invalid x-cron-secret
    res2 = client.post("/api/v1/cron/expiry", headers={"x-cron-secret": "wrong-secret"})
    assert res2.status_code == 401

def test_cron_endpoint_authorized():
    # Calling with valid CRON_SECRET via Bearer token
    res = client.get("/api/v1/cron/expiry", headers={"Authorization": f"Bearer {settings.CRON_SECRET}"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "completed"
    assert "expired_listings" in data
    assert "reminders_sent" in data

    # Calling with valid CRON_SECRET via x-cron-secret header
    res2 = client.post("/api/v1/cron/expiry", headers={"x-cron-secret": settings.CRON_SECRET})
    assert res2.status_code == 200
    assert res2.json()["status"] == "completed"
