import os
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "Маникюр Дрожжино — Премиальный Сервис Записи"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security & Telegram
    TELEGRAM_BOT_TOKEN: str = Field(default="8844800017:AAFM8PTOsd3l0B5sVcNmpm8RJZ6cmjMp4JE")
    ADMIN_TELEGRAM_IDS: List[int] = Field(default_factory=lambda: [708192421])
    WEBAPP_URL: str = Field(default="https://ment-effort-labeled-readers.trycloudflare.com")
    SECRET_KEY: str = Field(default="super-secret-key-change-in-production-beauty-salon")
    
    # Database
    DATABASE_URL: str = Field(default="sqlite+aiosqlite:///./manik_svet.db")
    
    # Business defaults
    DEFAULT_CURRENCY: str = "₽"
    DEFAULT_SLOT_INTERVAL_MINUTES: int = 30
    MIN_ADVANCE_BOOKING_HOURS: int = 2
    MAX_ADVANCE_BOOKING_DAYS: int = 30
    
    # Reminders
    REMINDER_HOURS_BEFORE: List[int] = [24, 2]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
