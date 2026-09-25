from datetime import date, time, datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.booking import BookingStatus
from app.schemas.service import ServiceOut
from app.schemas.user import UserOut

class BookingCreate(BaseModel):
    service_id: int
    booking_date: date
    start_time: time
    client_name: str = Field(..., min_length=2, max_length=100)
    client_phone: str = Field(..., min_length=5, max_length=30)
    notes: Optional[str] = None

class BookingReschedule(BaseModel):
    booking_date: date
    start_time: time

class BookingUpdateStatus(BaseModel):
    status: BookingStatus

class BookingOut(BaseModel):
    id: int
    user_id: int
    service_id: int
    booking_date: date
    start_time: time
    end_time: time
    price: float
    status: BookingStatus
    client_name: str
    client_phone: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    service: Optional[ServiceOut] = None
    user: Optional[UserOut] = None

    class Config:
        from_attributes = True
