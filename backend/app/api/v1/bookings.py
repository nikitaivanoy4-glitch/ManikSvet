from datetime import date, time, datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.models.service import Service
from app.models.booking import Booking, BookingStatus
from app.schemas.booking import BookingOut, BookingCreate, BookingReschedule, BookingUpdateStatus
from app.services.schedule_service import ScheduleService, add_minutes
from app.services.notification_service import NotificationService
from app.api.deps import get_current_user, get_current_admin
from app.core.config import settings

router = APIRouter(prefix="/bookings", tags=["Bookings"])

# Global reference to bot instance set at startup
bot_instance = None

def set_bot_instance(bot):
    global bot_instance
    bot_instance = bot

@router.post("", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
async def create_booking(
    booking_in: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create new booking with double booking protection"""
    # 1. Fetch service
    service_res = await db.execute(select(Service).where(Service.id == booking_in.service_id))
    service = service_res.scalar_one_or_none()
    if not service or not service.is_active:
        raise HTTPException(status_code=400, detail="Услуга недоступна для записи")

    # 2. Calculate end time
    start_t = booking_in.start_time
    end_t = add_minutes(start_t, service.duration_minutes)

    # 3. Verify double booking race condition
    is_free = await ScheduleService.verify_slot_available(
        db=db,
        target_date=booking_in.booking_date,
        start_time=start_t,
        end_time=end_t
    )
    if not is_free:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Выбранное время уже занято другим клиентом. Пожалуйста, выберите другое окно."
        )

    # 4. Update user profile name and phone if provided
    current_user.first_name = booking_in.client_name
    current_user.phone = booking_in.client_phone

    # 5. Create booking record
    booking = Booking(
        user_id=current_user.id,
        service_id=service.id,
        booking_date=booking_in.booking_date,
        start_time=start_t,
        end_time=end_t,
        price=service.price,
        status=BookingStatus.CONFIRMED,
        client_name=booking_in.client_name,
        client_phone=booking_in.client_phone,
        notes=booking_in.notes
    )
    db.add(booking)
    await db.commit()
    await db.refresh(booking)

    # Load relations for output and notification
    res = await db.execute(
        select(Booking)
        .options(selectinload(Booking.service), selectinload(Booking.user))
        .where(Booking.id == booking.id)
    )
    booking_loaded = res.scalar_one()

    # 6. Notify Master via Telegram Bot
    if bot_instance:
        await NotificationService.notify_new_booking(
            db=db,
            bot=bot_instance,
            booking=booking_loaded,
            master_telegram_ids=settings.ADMIN_TELEGRAM_IDS
        )

    return booking_loaded

@router.get("/my", response_model=List[BookingOut])
async def get_my_bookings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Fetch all bookings for the logged-in client"""
    res = await db.execute(
        select(Booking)
        .options(selectinload(Booking.service))
        .where(Booking.user_id == current_user.id)
        .order_by(Booking.booking_date.desc(), Booking.start_time.desc())
    )
    return res.scalars().all()

@router.post("/{booking_id}/cancel", response_model=BookingOut)
async def cancel_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Cancel booking by client or admin"""
    res = await db.execute(
        select(Booking)
        .options(selectinload(Booking.service), selectinload(Booking.user))
        .where(Booking.id == booking_id)
    )
    booking = res.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Запись не найдена")

    if booking.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Нет прав для отмены этой записи")

    if booking.status == BookingStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Запись уже отменена")

    booking.status = BookingStatus.CANCELLED
    await db.commit()
    await db.refresh(booking)

    if bot_instance:
        await NotificationService.notify_booking_cancellation(
            db=db,
            bot=bot_instance,
            booking=booking,
            master_telegram_ids=settings.ADMIN_TELEGRAM_IDS,
            cancelled_by_client=(booking.user_id == current_user.id)
        )

    return booking

@router.post("/{booking_id}/reschedule", response_model=BookingOut)
async def reschedule_booking(
    booking_id: int,
    reschedule_in: BookingReschedule,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Reschedule booking to new date and time"""
    res = await db.execute(
        select(Booking)
        .options(selectinload(Booking.service), selectinload(Booking.user))
        .where(Booking.id == booking_id)
    )
    booking = res.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Запись не найдена")

    if booking.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Нет доступа")

    old_date = booking.booking_date
    old_time = booking.start_time

    # Calculate new end time based on existing service
    service_duration = booking.service.duration_minutes if booking.service else 60
    new_end = add_minutes(reschedule_in.start_time, service_duration)

    is_free = await ScheduleService.verify_slot_available(
        db=db,
        target_date=reschedule_in.booking_date,
        start_time=reschedule_in.start_time,
        end_time=new_end,
        exclude_booking_id=booking.id
    )

    if not is_free:
        raise HTTPException(status_code=409, detail="Новое выбранное время уже занято")

    booking.booking_date = reschedule_in.booking_date
    booking.start_time = reschedule_in.start_time
    booking.end_time = new_end
    booking.status = BookingStatus.CONFIRMED

    await db.commit()
    await db.refresh(booking)

    if bot_instance:
        await NotificationService.notify_booking_reschedule(
            db=db,
            bot=bot_instance,
            booking=booking,
            old_date=old_date,
            old_time=old_time,
            master_telegram_ids=settings.ADMIN_TELEGRAM_IDS
        )

    return booking

# --- ADMIN ENDPOINTS ---

@router.get("", response_model=List[BookingOut])
async def get_all_bookings_admin(
    status_filter: Optional[str] = Query(None),
    target_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Admin endpoint to filter and view all bookings"""
    query = select(Booking).options(selectinload(Booking.service), selectinload(Booking.user))

    if status_filter:
        query = query.where(Booking.status == status_filter)
    if target_date:
        query = query.where(Booking.booking_date == target_date)

    query = query.order_by(Booking.booking_date.desc(), Booking.start_time.asc())
    res = await db.execute(query)
    return res.scalars().all()

@router.put("/{booking_id}/status", response_model=BookingOut)
async def update_booking_status_admin(
    booking_id: int,
    status_in: BookingUpdateStatus,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Admin endpoint to manually change booking status"""
    res = await db.execute(
        select(Booking)
        .options(selectinload(Booking.service), selectinload(Booking.user))
        .where(Booking.id == booking_id)
    )
    booking = res.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Запись не найдена")

    booking.status = status_in.status
    await db.commit()
    await db.refresh(booking)
    return booking
