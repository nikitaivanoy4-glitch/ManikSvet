from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class ReviewCreate(BaseModel):
    author_name: str = Field(..., min_length=2, max_length=100)
    rating: int = Field(..., ge=1, le=5)
    text: str = Field(..., min_length=5, max_length=1000)


class ReviewOut(BaseModel):
    id: int
    author_name: str
    rating: int
    text: str
    is_approved: bool
    created_at: datetime

    model_config = {"from_attributes": True}
