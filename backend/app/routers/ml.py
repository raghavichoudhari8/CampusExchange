from fastapi import APIRouter
from pydantic import BaseModel
from app.services.ml_service import ml_service

router = APIRouter(prefix="/api/v1/ml", tags=["AI / ML Services"])

class MLTextPayload(BaseModel):
    title: str
    description: str

@router.post("/categorize")
def categorize_text(payload: MLTextPayload):
    """Auto-categorizes listing title and description using Scikit-Learn classifier."""
    return ml_service.predict_category(payload.title, payload.description)

@router.post("/check-spam")
def check_spam(payload: MLTextPayload):
    """Evaluates spam and prohibited content score."""
    is_prohibited, spam_score, reason = ml_service.check_content(payload.title, payload.description)
    return {
        "is_prohibited": is_prohibited,
        "spam_score": spam_score,
        "reason": reason
    }
