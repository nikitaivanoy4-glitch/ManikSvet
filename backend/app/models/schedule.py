from datetime import date, time, datetime
from sqlalchemy import String, Boolean, Date, Time, DateTime, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class ScheduleDay(Base):
    __tablename__ = "schedule_days"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    date: Mapped[date] = mapped_column(Date, unique=True, nullable=False, index=True)
    is_working: Mapped[bool] = mapped_column(Boolean, default=True)
    start_time: Mapped[time] = mapped_column(Time, default=time(10, 0))
    end_time: Mapped[time] = mapped_column(Time, default=time(20, 0))
    break_start: Mapped[time] = mapped_column(Time, nullable=True)
    break_end: Mapped[time] = mapped_column(Time, nullable=True)
    note: Mapped[str] = mapped_column(String(200), nullable=True)

    slots = relationship("ScheduleSlotOverride", back_populates="schedule_day", cascade="all, delete-orphan")

class ScheduleSlotOverride(Base):
    """Custom slot block/unlock for specific time windows on a given day"""
    __tablename__ = "schedule_slot_overrides"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    schedule_day_id: Mapped[int] = mapped_column(ForeignKey("schedule_days.id", ondelete="CASCADE"), nullable=False, index=True)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    is_blocked: Mapped[bool] = mapped_column(Boolean, default=True)  # True = master closed this slot
    reason: Mapped[str] = mapped_column(String(200), nullable=True)

    schedule_day = relationship("ScheduleDay", back_populates="slots")
