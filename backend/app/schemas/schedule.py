from datetime import date, time
from typing import Optional, List
from pydantic import BaseModel, Field

class TimeSlot(BaseModel):
    start_time: time
    end_time: time
    is_available: bool
    reason: Optional[str] = None

class AvailableDateOut(BaseModel):
    date: date
    is_working: bool
    available_slots_count: int

class ScheduleDayCreateOrUpdate(BaseModel):
    date: date
    is_working: bool = True
    start_time: time = time(10, 0)
    end_time: time = time(20, 0)
    break_start: Optional[time] = None
    break_end: Optional[time] = None
    note: Optional[str] = None

class SlotOverrideCreate(BaseModel):
    start_time: time
    end_time: time
    is_blocked: bool = True
    reason: Optional[str] = None

class ScheduleDayOut(BaseModel):
    id: int
    date: date
    is_working: bool
    start_time: time
    end_time: time
    break_start: Optional[time] = None
    break_end: Optional[time] = None
    note: Optional[str] = None

    class Config:
        from_attributes = True
