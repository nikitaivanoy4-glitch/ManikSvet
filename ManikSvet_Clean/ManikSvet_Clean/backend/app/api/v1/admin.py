from datetime import date, datetime, timedelta
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.models.booking import Booking, BookingStatus
from app.models.service import Service
from app.schemas.user import ClientStatsOut
from app.schemas.booking import BookingOut
from app.services.schedule_service import ScheduleService
from app.api.deps import get_current_admin

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])

@router.get("/dashboard")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
) -> Dict[str, Any]:
    today = datetime.now().date()
    tomorrow = today + timedelta(days=1)
    month_start = date(today.year, today.month, 1)

    # 1. Today's bookings
    today_bookings_res = await db.execute(
        select(Booking)
        .options(selectinload(Booking.service))
        .where(
            and_(
                Booking.booking_date == today,
                Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.COMPLETED])
            )
        )
        .order_by(Booking.start_time.asc())
    )
    today_bookings = today_bookings_res.scalars().all()
    today_revenue = sum(b.price for b in today_bookings)

    # 2. Tomorrow's bookings
    tomorrow_bookings_res = await db.execute(
        select(Booking)
        .options(selectinload(Booking.service))
        .where(
            and_(
                Booking.booking_date == tomorrow,
                Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.COMPLETED])
            )
        )
        .order_by(Booking.start_time.asc())
    )
    tomorrow_bookings = tomorrow_bookings_res.scalars().all()

    # 3. Monthly revenue & bookings count
    month_bookings_res = await db.execute(
        select(Booking).where(
            and_(
                Booking.booking_date >= month_start,
                Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.COMPLETED])
            )
        )
    )
    month_bookings = month_bookings_res.scalars().all()
    month_revenue = sum(b.price for b in month_bookings)

    # 4. Total clients count
    total_clients_res = await db.execute(select(func.count(User.id)).where(User.is_admin == False))
    total_clients_count = total_clients_res.scalar() or 0

    # 5. Free slots today calculation (using average 60-min service)
    today_slots = await ScheduleService.get_available_slots(db, today, duration_minutes=60)
    free_slots_today_count = len(today_slots)

    return {
        "today": {
            "date": today.isoformat(),
            "bookings_count": len(today_bookings),
            "revenue": today_revenue,
            "free_slots_count": free_slots_today_count,
            "bookings": [BookingOut.model_validate(b) for b in today_bookings]
        },
        "tomorrow": {
            "date": tomorrow.isoformat(),
            "bookings_count": len(tomorrow_bookings),
            "bookings": [BookingOut.model_validate(b) for b in tomorrow_bookings]
        },
        "month": {
            "revenue": month_revenue,
            "bookings_count": len(month_bookings)
        },
        "total_clients": total_clients_count
    }

@router.get("/clients", response_model=List[ClientStatsOut])
async def get_clients_list(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Admin view for all registered clients with booking analytics"""
    users_res = await db.execute(
        select(User).options(selectinload(User.bookings)).order_by(User.id.desc())
    )
    users = users_res.scalars().all()

    result = []
    for u in users:
        total_b = len(u.bookings)
        completed_b = sum(1 for b in u.bookings if b.status == BookingStatus.COMPLETED or b.status == BookingStatus.CONFIRMED)
        total_spent = sum(b.price for b in u.bookings if b.status in [BookingStatus.CONFIRMED, BookingStatus.COMPLETED])
        
        last_date = None
        if u.bookings:
            sorted_b = sorted(u.bookings, key=lambda x: x.booking_date, reverse=True)
            last_date = sorted_b[0].booking_date.strftime("%d.%m.%Y")

        stats = ClientStatsOut(
            id=u.id,
            telegram_id=u.telegram_id,
            first_name=u.first_name,
            last_name=u.last_name,
            username=u.username,
            phone=u.phone,
            is_admin=u.is_admin,
            created_at=u.created_at,
            total_bookings=total_b,
            completed_bookings=completed_b,
            total_spent=total_spent,
            last_booking_date=last_date
        )
        result.append(stats)

    return result
