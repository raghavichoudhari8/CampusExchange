from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class DecryptedContactInfo(BaseModel):
    contact_type: str
    contact_value: str
    preferred_note: Optional[str] = None

class ListingCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10, max_length=5000)
    category_id: str
    campus_id: str
    price: float = Field(0.0, ge=0.0)
    is_free: bool = False
    condition: str = Field("good", pattern="^(brand_new|like_new|good|fair)$")
    location_note: str = Field("Campus Library / Student Union", max_length=255)
    images: List[str] = []
    # Contact information to encrypt and keep private
    contact_type: str = Field("email", pattern="^(phone|email|whatsapp)$")
    contact_value: str = Field(..., min_length=3, max_length=255)
    preferred_note: Optional[str] = Field(None, max_length=255)

class ListingStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(active|reserved|sold|expired)$")

class ListingResponse(BaseModel):
    id: str
    seller_id: str
    seller_name: Optional[str] = None
    seller_badges: List[str] = []
    campus_id: str
    campus_name: Optional[str] = None
    category_id: str
    category_name: Optional[str] = None
    title: str
    description: str
    price: float
    is_free: bool
    condition: str
    location_note: str
    status: str
    spam_score: Optional[float] = 0.0
    view_count: int
    images: List[str] = []
    expires_at: str
    created_at: str
    updated_at: str
    # Privacy conditional fields
    has_pending_request: bool = False
    approved_contact: Optional[DecryptedContactInfo] = None

class CategoryResponse(BaseModel):
    id: str
    name: str
    slug: str
    parent_id: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    sort_order: int
