from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class ServiceBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=150)
    description: Optional[str] = None
    price: float = Field(..., ge=0)
    duration_minutes: int = Field(..., ge=15, le=480)
    image_url: Optional[str] = None
    is_active: bool = True
    display_order: int = 0

class ServiceCreate(ServiceBase):
    pass

class ServiceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    duration_minutes: Optional[int] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None

class ServiceOut(ServiceBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
