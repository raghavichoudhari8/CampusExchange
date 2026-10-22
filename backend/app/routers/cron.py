from typing import Optional, Dict, Any
from fastapi import APIRouter, Header, HTTPException, status
from app.config import settings
from app.services.expiry_job import run_expiry_scan

router = APIRouter(prefix="/api/v1/cron", tags=["Vercel Cron Jobs"])

@router.get("/expiry", summary="Execute 30-day listing auto-expiry and reminder alerts")
@router.post("/expiry", summary="Execute 30-day listing auto-expiry and reminder alerts")
def trigger_cron_expiry(
    authorization: Optional[str] = Header(None),
    x_cron_secret: Optional[str] = Header(None, alias="x-cron-secret"),
    x_vercel_cron: Optional[str] = Header(None, alias="x-vercel-cron")
) -> Dict[str, Any]:
    """
    Automated Cron Job for listing lifecycle management:
    - Auto-expires listings older than 30 days.
    - Sends pre-expiry reminder emails to sellers for items expiring within 3 days.
    
    Security:
    Authenticated via Vercel's `CRON_SECRET` header or `Authorization: Bearer <CRON_SECRET>`.
    Unauthenticated invocations are strictly rejected with 401 Unauthorized.
    """
    expected = settings.CRON_SECRET
    if not expected:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="CRON_SECRET is not configured on this server."
        )

    # Extract bearer token if passed in Authorization header
    bearer_token = None
    if authorization:
        if authorization.lower().startswith("bearer "):
            bearer_token = authorization[7:].strip()
        else:
            bearer_token = authorization.strip()

    is_authorized = (
        bearer_token == expected or
        x_cron_secret == expected
    )

    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Invalid or missing CRON_SECRET credentials."
        )

    result = run_expiry_scan()
    return result
