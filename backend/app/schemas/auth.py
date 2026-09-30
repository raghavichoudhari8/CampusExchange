from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    is_verified: bool
    role: str

class DemoLoginRequest(BaseModel):
    user_id_or_email: str

class DomainCheckRequest(BaseModel):
    email: str

class DomainCheckResponse(BaseModel):
    email: str
    domain: str
    is_allowed: bool
    college_name: Optional[str] = None
    reason: Optional[str] = None

class OnboardingRequest(BaseModel):
    display_name: str = Field(..., min_length=2, max_length=100)
    campus_id: str
    hostel_building: Optional[str] = Field(None, max_length=100)
    batch_year: int = Field(..., ge=2000, le=2035)

class UserProfileResponse(BaseModel):
    id: str
    email: str
    domain: str
    is_verified: bool
    display_name: str
    campus_id: Optional[str] = None
    campus_name: Optional[str] = None
    hostel_building: Optional[str] = None
    batch_year: Optional[int] = None
    role: str
    is_banned: bool
    avg_response_time_minutes: Optional[int] = None
    avatar_url: Optional[str] = None
    badges: List[str] = []
