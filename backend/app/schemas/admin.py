from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class AdminStatsResponse(BaseModel):
    total_users: int
    verified_students: int
    active_listings: int
    flagged_listings: int
    total_audit_events: int

class ModerateListingRequest(BaseModel):
    action: str = Field(..., pattern="^(approve|delete)$")

class BanUserRequest(BaseModel):
    is_banned: bool
    reason: Optional[str] = None

class AddAllowedDomainRequest(BaseModel):
    domain: str = Field(..., min_length=2, max_length=255)
    college_name: str = Field(..., min_length=2, max_length=255)

class AuditLogEntry(BaseModel):
    id: str
    actor_id: Optional[str] = None
    action: str
    target_type: str
    target_id: Optional[str] = None
    details: Dict[str, Any] = {}
    ip_address: Optional[str] = None
    created_at: str
