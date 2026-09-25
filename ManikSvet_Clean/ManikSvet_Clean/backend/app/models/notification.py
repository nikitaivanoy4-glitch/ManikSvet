from datetime import datetime
from sqlalchemy import String, Integer, DateTime, Text, ForeignKey, BigInteger
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base

class NotificationLog(Base):
    __tablename__ = "notification_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    telegram_id: Mapped[int] = mapped_column(BigInteger, nullable=False, index=True)
    booking_id: Mapped[int] = mapped_column(ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True)
    notification_type: Mapped[str] = mapped_column(String(50), nullable=False) # reminder_24h, reminder_2h, confirmation, cancellation
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="sent") # sent, failed, pending
    scheduled_for: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    sent_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
