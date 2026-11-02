import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone
import httpx
from app.config import settings
from app.database import db

logger = logging.getLogger(__name__)

DEFAULT_CAMPUS_ID = "22222222-0000-0000-0000-000000000005"

def ensure_profile_in_supabase(user_data: Dict[str, Any], campus_id: Optional[str] = None) -> bool:
    """
    Guarantees that a user profile is persisted in Supabase before attempting
    operations (like posting listings) that depend on profiles(id) foreign key.
    
    Handles:
    - PostgREST upsert with ?on_conflict=id and Prefer: resolution=merge-duplicates
    - 409 unique constraint conflicts on profiles_email_key
    - 409/400 foreign key/syntax violations on profiles_campus_id_fkey
    - Keeps in-memory db.profiles in sync
    """
    user_id = user_data.get("id")
    if not user_id:
        return False

    # In-memory sync
    mem_user = next((p for p in db.profiles if p["id"] == user_id), None)
    if not mem_user:
        db.profiles.append(user_data)
    else:
        mem_user.update(user_data)

    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        return True

    safe_campus_id = campus_id or user_data.get("campus_id")
    if not safe_campus_id or len(safe_campus_id) < 10:
        safe_campus_id = DEFAULT_CAMPUS_ID

    now_iso = datetime.now(timezone.utc).isoformat()
    email = (user_data.get("email") or "").strip()
    domain = user_data.get("domain") or (email.split("@")[-1] if "@" in email else "")
    display_name = user_data.get("display_name") or (email.split("@")[0] if "@" in email else "Student")

    profile_payload = {
        "id": user_id,
        "email": email,
        "domain": domain,
        "is_verified": bool(user_data.get("is_verified", True)),
        "display_name": display_name,
        "campus_id": safe_campus_id,
        "hostel_building": user_data.get("hostel_building"),
        "batch_year": user_data.get("batch_year"),
        "role": user_data.get("role", "student"),
        "is_banned": bool(user_data.get("is_banned", False)),
        "created_at": user_data.get("created_at") or now_iso,
        "updated_at": now_iso
    }

    base_url = settings.SUPABASE_URL.rstrip('/')
    headers = {
        "apikey": settings.SUPABASE_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }

    try:
        with httpx.Client(timeout=8.0) as client:
            # Step 1: Direct upsert with conflict target 'id'
            res = client.post(
                f"{base_url}/rest/v1/profiles?on_conflict=id",
                headers=headers,
                json=profile_payload
            )
            if 200 <= res.status_code < 300:
                return True

            logger.warning(f"Profile upsert returned {res.status_code}: {res.text}")

            # Step 2: Handle unique email key conflict (profiles_email_key)
            if res.status_code == 409 and "profiles_email_key" in res.text and email:
                patch_res = client.patch(
                    f"{base_url}/rest/v1/profiles?email=eq.{email}",
                    headers={
                        "apikey": settings.SUPABASE_KEY,
                        "Authorization": f"Bearer {settings.SUPABASE_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "id": user_id,
                        "display_name": display_name,
                        "campus_id": safe_campus_id,
                        "is_verified": profile_payload["is_verified"],
                        "updated_at": now_iso
                    }
                )
                if 200 <= patch_res.status_code < 300:
                    return True

            # Step 3: Handle campus_id foreign key conflict (profiles_campus_id_fkey) or uuid syntax error
            if res.status_code in (400, 409) and ("profiles_campus_id_fkey" in res.text or "22P02" in res.text):
                profile_payload["campus_id"] = DEFAULT_CAMPUS_ID
                retry_res = client.post(
                    f"{base_url}/rest/v1/profiles?on_conflict=id",
                    headers=headers,
                    json=profile_payload
                )
                if 200 <= retry_res.status_code < 300:
                    return True

            # Step 4: Final verification check: does profile exist in Supabase?
            check_res = client.get(
                f"{base_url}/rest/v1/profiles?id=eq.{user_id}&select=id",
                headers=headers
            )
            if check_res.status_code == 200 and len(check_res.json()) > 0:
                return True

    except Exception as e:
        logger.error(f"Error ensuring profile in Supabase: {e}")

    return False
