from typing import Optional, List
from pydantic import BaseModel, Field
from app.schemas.listings import DecryptedContactInfo

class ContactRequestCreate(BaseModel):
    listing_id: str
    message: Optional[str] = Field(None, max_length=500)

class ContactResponseAction(BaseModel):
    action: str = Field(..., pattern="^(approve|decline|revoke)$")

class ContactRequestResponse(BaseModel):
    id: str
    listing_id: str
    listing_title: str
    buyer_id: str
    buyer_name: str
    buyer_email: Optional[str] = None
    buyer_campus: Optional[str] = None
    buyer_badges: List[str] = []
    seller_id: str
    seller_name: Optional[str] = None
    message: Optional[str] = None
    status: str
    responded_at: Optional[str] = None
    created_at: str
    # Privacy protected: ONLY populated when status is 'approved' for that buyer!
    contact_details: Optional[DecryptedContactInfo] = None
