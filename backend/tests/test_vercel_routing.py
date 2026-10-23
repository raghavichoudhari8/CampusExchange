import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    res = client.get("/")
    assert res.status_code == 200
    assert "CampusSwap API" in res.json()["message"]

def test_health_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

    res_slash = client.get("/health/")
    assert res_slash.status_code == 200
    assert res_slash.json()["status"] == "healthy"

def test_vercel_direct_entrypoint_routes():
    res_index = client.get("/api/index.py")
    assert res_index.status_code == 200
    assert "CampusSwap API" in res_index.json()["message"]

    res_main = client.get("/main.py")
    assert res_main.status_code == 200
    assert "CampusSwap API" in res_main.json()["message"]

def test_vercel_rewritten_path_normalization():
    # If Vercel rewrites to /api/index.py/health
    res = client.get("/api/index.py/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

    # If Vercel passes x-matched-path header
    res_matched = client.get("/api/index.py", headers={"x-matched-path": "/health"})
    assert res_matched.status_code == 200
    assert res_matched.json()["status"] == "healthy"
