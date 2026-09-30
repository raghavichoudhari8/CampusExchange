from datetime import datetime, timezone, timedelta
from typing import Dict, Any
from app.database import db
from app.services.email_service import email_service

def run_expiry_scan() -> Dict[str, Any]:
    """
    Evaluates listing expiration rules:
    - Auto-expires listings older than 30 days (`expires_at < now`).
    - Dispatches pre-expiry email alerts to sellers for items expiring within 3 days.
    """
    now = datetime.now(timezone.utc)
    expired_count = 0
    reminders_sent = 0

    for listing in db.listings:
        if listing.get("status") not in ["active", "reserved"]:
            continue

        try:
            expires_at = datetime.fromisoformat(listing["expires_at"])
            # Ensure timezone awareness
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
        except Exception:
            continue

        # Case 1: Past 30-day expiration deadline
        if expires_at <= now:
            listing["status"] = "expired"
            listing["updated_at"] = now.isoformat()
            expired_count += 1
            continue

        # Case 2: Expiring within 3 days (pre-expiry reminder alert)
        time_left = expires_at - now
        if timedelta(days=0) < time_left <= timedelta(days=3):
            seller = next((p for p in db.profiles if p["id"] == listing["seller_id"]), None)
            if seller and not listing.get("expiry_reminded"):
                days_left = max(1, time_left.days)
                email_service.notify_listing_expiry(
                    seller_email=seller["email"],
                    seller_name=seller["display_name"],
                    listing_title=listing["title"],
                    days_left=days_left
                )
                listing["expiry_reminded"] = True
                reminders_sent += 1

    return {
        "status": "completed",
        "timestamp": now.isoformat(),
        "expired_listings": expired_count,
        "reminders_sent": reminders_sent
    }
