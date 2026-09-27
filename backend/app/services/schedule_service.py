from datetime import date, time, datetime, timedelta
from typing import List, Tuple, Optional, Dict
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.schedule import ScheduleDay, ScheduleSlotOverride
from app.models.booking import Booking, BookingStatus
from app.models.setting import Setting
from app.schemas.schedule import TimeSlot

def add_minutes(t: time, minutes: int) -> time:
    full_dt = datetime.combine(date.today(), t) + timedelta(minutes=minutes)
    return full_dt.time()

def time_to_minutes(t: time) -> int:
    return t.hour * 60 + t.minute

def is_overlap(start1: time, end1: time, start2: time, end2: time) -> bool:
    s1, e1 = time_to_minutes(start1), time_to_minutes(end1)
    s2, e2 = time_to_minutes(start2), time_to_minutes(end2)
    return max(s1, s2) < min(e1, e2)

class ScheduleService:

    @staticmethod
    async def get_day_schedule(db: AsyncSession, target_date: date) -> Tuple[bool, time, time, Optional[time], Optional[time]]:
        """Get or compute default schedule for a target date"""
        result = await db.execute(select(ScheduleDay).where(ScheduleDay.date == target_date))
        schedule = result.scalar_one_or_none()
        
        if schedule:
            return schedule.is_working, schedule.start_time, schedule.end_time, schedule.break_start, schedule.break_end
        
        # Default working days (Monday-Saturday working 10:00-20:00, Sunday day off)
        weekday = target_date.weekday() # 0 = Mon, 6 = Sun
        if weekday == 6: # Sunday day off by default
            return False, time(10, 0), time(20, 0), None, None
        return True, time(10, 0), time(20, 0), time(14, 0), time(15, 0)

    @staticmethod
    async def get_available_slots(
        db: AsyncSession,
        target_date: date,
        duration_minutes: int,
        slot_step_minutes: int = 30
    ) -> List[TimeSlot]:
        """Calculates available starting time slots for target_date considering service duration"""
        is_working, day_start, day_end, break_start, break_end = await ScheduleService.get_day_schedule(db, target_date)
        
        if not is_working:
            return []

        # Get existing bookings for this date (excluding cancelled)
        bookings_result = await db.execute(
            select(Booking).where(
                and_(
                    Booking.booking_date == target_date,
                    Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.PENDING])
                )
            )
        )
        existing_bookings = bookings_result.scalars().all()

        # Get manual slot overrides for this date
        sched_day_res = await db.execute(select(ScheduleDay).where(ScheduleDay.date == target_date))
        sched_day = sched_day_res.scalar_one_or_none()
        overrides = []
        if sched_day:
            overrides_res = await db.execute(
                select(ScheduleSlotOverride).where(ScheduleSlotOverride.schedule_day_id == sched_day.id)
            )
            overrides = overrides_res.scalars().all()

        slots: List[TimeSlot] = []
        curr_min = time_to_minutes(day_start)
        end_day_min = time_to_minutes(day_end)

        now = datetime.now()
        is_today = target_date == now.date()
        min_advance_time = now + timedelta(hours=2) # default 2h advance

        while curr_min + duration_minutes <= end_day_min:
            slot_start = time(curr_min // 60, curr_min % 60)
            slot_end_min = curr_min + duration_minutes
            slot_end = time(slot_end_min // 60, slot_end_min % 60)

            is_available = True
            reason = None

            # Check if slot is in past or too close to current time
            if is_today:
                slot_datetime = datetime.combine(target_date, slot_start)
                if slot_datetime < min_advance_time:
                    curr_min += slot_step_minutes
                    continue

            # Check break time overlap
            if break_start and break_end:
                if is_overlap(slot_start, slot_end, break_start, break_end):
                    is_available = False
                    reason = "Перерыв"

            # Check existing bookings overlap
            if is_available:
                for b in existing_bookings:
                    if is_overlap(slot_start, slot_end, b.start_time, b.end_time):
                        is_available = False
                        reason = "Занято"
                        break

            # Check manual overrides / blocks
            if is_available:
                for ov in overrides:
                    if ov.is_blocked and is_overlap(slot_start, slot_end, ov.start_time, ov.end_time):
                        is_available = False
                        reason = ov.reason or "Недоступно"
                        break

            if is_available:
                slots.append(TimeSlot(start_time=slot_start, end_time=slot_end, is_available=True))

            curr_min += slot_step_minutes

        return slots

    @staticmethod
    async def verify_slot_available(
        db: AsyncSession,
        target_date: date,
        start_time: time,
        end_time: time,
        exclude_booking_id: Optional[int] = None
    ) -> bool:
        """Atomic verification that slot has zero overlapping confirmed/pending bookings"""
        query = select(Booking).where(
            and_(
                Booking.booking_date == target_date,
                Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.PENDING])
            )
        )
        if exclude_booking_id:
            query = query.where(Booking.id != exclude_booking_id)

        result = await db.execute(query)
        bookings = result.scalars().all()

        for b in bookings:
            if is_overlap(start_time, end_time, b.start_time, b.end_time):
                return False

        return True
