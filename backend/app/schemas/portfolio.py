from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class PortfolioBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=150)
    description: Optional[str] = None
    category: Optional[str] = "Маникюр"
    image_url: str = Field(..., min_length=5)
    is_visible: bool = True
    display_order: int = 0

class PortfolioCreate(PortfolioBase):
    pass

class PortfolioUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    is_visible: Optional[bool] = None
    display_order: Optional[int] = None

class PortfolioOut(PortfolioBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
