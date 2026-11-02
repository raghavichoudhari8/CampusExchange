from typing import Optional, List
from pydantic import BaseModel, Field

class ConversationStart(BaseModel):
    listing_id: str
    initial_message: Optional[str] = Field(None, max_length=1000)

class MessageSend(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)

class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    sender_name: str
    recipient_id: str
    content: str
    created_at: str
    is_read: bool = False

class ConversationParticipant(BaseModel):
    id: str
    display_name: str
    is_verified: bool = False
    campus_name: Optional[str] = None

class ConversationListing(BaseModel):
    id: str
    title: str
    price: float
    is_free: bool = False
    image: Optional[str] = None
    status: str = "active"
    location_note: Optional[str] = None

class ConversationResponse(BaseModel):
    id: str
    listing: ConversationListing
    other_user: ConversationParticipant
    last_message: Optional[MessageResponse] = None
    unread_count: int = 0
    created_at: str
    updated_at: str
