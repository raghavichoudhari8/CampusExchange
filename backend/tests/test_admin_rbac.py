import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import db
from app.security.auth import create_access_token

client = TestClient(app)

def test_admin_rbac_protection():
    admin_id = "44444444-0000-0000-0000-000000000001"
    student_id = "44444444-0000-0000-0000-000000000002"

    admin_token = create_access_token(admin_id, "admin@campusswap.edu", role="admin", is_verified=True)
    student_token = create_access_token(student_id, "alex.chen@mit.edu", role="student", is_verified=True)

    # 1. Non-admin student is blocked from admin stats with 403
    res_student = client.get("/api/v1/admin/stats", headers={"Authorization": f"Bearer {student_token}"})
    assert res_student.status_code == 403
    assert "Admin privileges required" in res_student.json()["detail"]

    # 2. Admin can access stats
    res_admin = client.get("/api/v1/admin/stats", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_admin.status_code == 200
    stats = res_admin.json()
    assert "total_users" in stats
    assert "verified_students" in stats

    # 3. Add and delete allowed domain
    res_add_domain = client.post(
        "/api/v1/admin/allowed-domains",
        json={"domain": "oxford.ac.uk", "college_name": "University of Oxford"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_add_domain.status_code == 200
    created_domain = res_add_domain.json()
    assert created_domain["domain"] == "oxford.ac.uk"

    # Delete allowed domain
    res_del_domain = client.delete(
        f"/api/v1/admin/allowed-domains/{created_domain['id']}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_del_domain.status_code == 200

    # 4. User Banning workflow
    target_user_id = "44444444-0000-0000-0000-000000000004" # Marcus Vance
    marcus_token = create_access_token(target_user_id, "marcus.v@stanford.edu", is_verified=True)

    # Marcus initially can get /me
    res_me_before = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {marcus_token}"})
    assert res_me_before.status_code == 200

    # Admin bans Marcus
    res_ban = client.post(
        f"/api/v1/admin/users/{target_user_id}/ban",
        json={"is_banned": True, "reason": "Repeated spam violation"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_ban.status_code == 200
    assert res_ban.json()["is_banned"] is True

    # Now Marcus is blocked everywhere with 403
    res_me_after = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {marcus_token}"})
    assert res_me_after.status_code == 403
    assert "banned" in res_me_after.json()["detail"].lower()

    # Admin unbans Marcus
    res_unban = client.post(
        f"/api/v1/admin/users/{target_user_id}/ban",
        json={"is_banned": False},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_unban.status_code == 200
    assert res_unban.json()["is_banned"] is False

    # Marcus can access again
    res_me_restored = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {marcus_token}"})
    assert res_me_restored.status_code == 200
