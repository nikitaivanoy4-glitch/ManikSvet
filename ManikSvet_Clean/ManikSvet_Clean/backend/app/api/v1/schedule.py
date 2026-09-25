from datetime import date, datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.service import Service
from app.models.schedule import ScheduleDay, ScheduleSlotOverride
from app.schemas.schedule import AvailableDateOut, TimeSlot, ScheduleDayCreateOrUpdate, SlotOverrideCreate, ScheduleDayOut
from app.services.schedule_service import ScheduleService
from app.api.deps import get_current_user, get_current_admin
from app.models.user import User

router = APIRouter(prefix="/schedule", tags=["Schedule"])

@router.get("/dates", response_model=List[AvailableDateOut])
async def get_available_dates(
    service_id: int = Query(...),
    days_ahead: int = Query(30, ge=1, le=90),
    db: AsyncSession = Depends(get_db)
):
    """List available booking dates for the next N days"""
    service_res = await db.execute(select(Service).where(Service.id == service_id))
    service = service_res.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    today = datetime.now().date()
    result: List[AvailableDateOut] = []

    for i in range(days_ahead):
        target_date = today + timedelta(days=i)
        slots = await ScheduleService.get_available_slots(db, target_date, service.duration_minutes)
        is_working, _, _, _, _ = await ScheduleService.get_day_schedule(db, target_date)
        
        result.append(AvailableDateOut(
            date=target_date,
            is_working=is_working,
            available_slots_count=len(slots)
        ))

    return result

@router.get("/slots", response_model=List[TimeSlot])
async def get_available_slots(
    service_id: int = Query(...),
    booking_date: date = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """List available starting time slots for a specific date and service"""
    service_res = await db.execute(select(Service).where(Service.id == service_id))
    service = service_res.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    return await ScheduleService.get_available_slots(db, booking_date, service.duration_minutes)

@router.post("/day", response_model=ScheduleDayOut)
async def update_schedule_day(
    day_in: ScheduleDayCreateOrUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Admin endpoint to set working hours / day off for a specific date"""
    result = await db.execute(select(ScheduleDay).where(ScheduleDay.date == day_in.date))
    sched_day = result.scalar_one_or_none()

    if not sched_day:
        sched_day = ScheduleDay(**day_in.model_dump())
        db.add(sched_day)
    else:
        for f, v in day_in.model_dump().items():
            setattr(sched_day, f, v)

    await db.commit()
    await db.refresh(sched_day)
    return sched_day
