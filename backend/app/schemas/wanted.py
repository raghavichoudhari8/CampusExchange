from typing import Optional, List
from pydantic import BaseModel, Field

class WantedCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10, max_length=2000)
    category_id: str
    campus_id: str
    budget_max: Optional[float] = Field(None, ge=0.0)

class WantedResponse(BaseModel):
    id: str
    user_id: str
    user_name: str
    user_badges: List[str] = []
    campus_id: str
    campus_name: str
    category_id: str
    category_name: str
    title: str
    description: str
    budget_max: Optional[float] = None
    status: str
    created_at: str
