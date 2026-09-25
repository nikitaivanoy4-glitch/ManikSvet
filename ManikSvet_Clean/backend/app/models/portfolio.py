from datetime import datetime
from sqlalchemy import String, Boolean, Text, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base

class PortfolioItem(Base):
    __tablename__ = "portfolio"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(100), nullable=True, default="Маникюр")
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    is_visible: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
