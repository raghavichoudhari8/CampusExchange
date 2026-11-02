import re
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    is_verified: bool
    role: str

class DemoLoginRequest(BaseModel):
    user_id_or_email: str

    @field_validator("user_id_or_email")
    @classmethod
    def validate_user_input(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("User ID or email cannot be empty.")
        return clean

class DomainCheckRequest(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        clean = v.strip().lower()
        if not EMAIL_REGEX.match(clean):
            raise ValueError("Invalid email address format.")
        return clean

class DomainCheckResponse(BaseModel):
    email: str
    domain: str
    is_allowed: bool
    college_name: Optional[str] = None
    reason: Optional[str] = None

class OnboardingRequest(BaseModel):
    display_name: str = Field(..., min_length=2, max_length=100)
    campus_id: str
    custom_campus_name: Optional[str] = Field(None, max_length=150)
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
