import asyncio
import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, date, time as time_type
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
import httpx
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import engine, Base, AsyncSessionLocal
from app.core.init_db import seed_initial_data
from app.api.router import api_router
from app.api.v1.bookings import set_bot_instance
from app.bot.bot import bot, dp

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

bot_task = None
keep_alive_task = None
review_reminder_task = None


async def start_telegram_bot():
    """Start Telegram bot long-polling cleanly after removing any active webhooks"""
    if not bot:
        return
    try:
        logger.info("Clearing any existing Telegram Webhooks...")
        await bot.delete_webhook(drop_pending_updates=True)
        logger.info("Starting Telegram Bot long-polling...")
        await dp.start_polling(bot, drop_pending_updates=True)
    except asyncio.CancelledError:
        logger.info("Telegram Bot polling task cancelled.")
    except Exception as e:
        logger.error(f"Telegram Bot polling error: {e}", exc_info=True)


async def keep_alive_ping():
    """Ping self every 14 minutes to prevent Railway free tier from sleeping"""
    webapp_url = settings.WEBAPP_URL
    ping_url = f"{webapp_url.rstrip('/')}/ping" if webapp_url.startswith("https://") else None
    if not ping_url:
        return
    await asyncio.sleep(60)  # Wait 1 minute after startup before first ping
    while True:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                await client.get(ping_url)
            logger.info("Keep-alive ping sent successfully")
        except Exception as e:
            logger.warning(f"Keep-alive ping failed: {e}")
        await asyncio.sleep(14 * 60)  # Ping every 14 minutes


async def send_review_reminder(user_telegram_id: int, client_name: str):
    """Send a review request message to the client via Telegram"""
    if not bot:
        return
    try:
        from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
        webapp_url = settings.WEBAPP_URL.rstrip("/")
        review_url = f"{webapp_url}#reviews"

        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(
                text="⭐ Оставить отзыв",
                web_app=WebAppInfo(url=review_url)
            )]
        ])

        text = (
            f"💅 <b>Спасибо за посещение, {client_name}!</b>\n\n"
            "Надеемся, что вы остались довольны работой мастера Светланы 🌸\n\n"
            "Нам очень важно ваше мнение! Пожалуйста, оставьте отзыв — это займёт всего минуту:\n"
        )

        await bot.send_message(
            chat_id=user_telegram_id,
            text=text,
            parse_mode="HTML",
            reply_markup=keyboard
        )
        logger.info(f"Review reminder sent to user tg_id={user_telegram_id}")
    except Exception as e:
        logger.error(f"Failed to send review reminder to {user_telegram_id}: {e}")


async def notify_admin_new_review(author_name: str, rating: int, text: str):
    """Notify admin (mom) in Telegram DM when a new review is submitted"""
    if not bot:
        return
    try:
        stars = "⭐" * rating
        msg = (
            f"📬 <b>Новый отзыв!</b>\n\n"
            f"👤 Автор: <b>{author_name}</b>\n"
            f"Оценка: {stars}\n"
            f"📝 Текст: {text}\n\n"
            f"<i>Перейдите в Кабинет Мастера → Отзывы для модерации</i>"
        )
        for admin_id in settings.ADMIN_TELEGRAM_IDS:
            await bot.send_message(chat_id=admin_id, text=msg, parse_mode="HTML")
        logger.info(f"Admin notified about new review from {author_name}")
    except Exception as e:
        logger.error(f"Failed to notify admin about new review: {e}")


async def review_reminder_loop():
    """
    Background task: every 10 minutes check for bookings that ended 3+ hours ago
    and haven't had a review reminder sent yet. Send Telegram message to those clients.
    """
    from app.models.booking import Booking, BookingStatus
    from app.models.user import User

    # Wait 2 minutes after startup before first check
    await asyncio.sleep(2 * 60)

    while True:
        try:
            now = datetime.utcnow()
            three_hours_ago = now - timedelta(hours=3)

            async with AsyncSessionLocal() as db:
                result = await db.execute(
                    select(Booking)
                    .options(selectinload(Booking.user))
                    .where(
                        and_(
                            Booking.review_reminder_sent == False,
                            Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.COMPLETED])
                        )
                    )
                )
                bookings = result.scalars().all()

                for booking in bookings:
                    try:
                        booking_end_dt = datetime.combine(booking.booking_date, booking.end_time)
                    except Exception:
                        continue

                    if booking_end_dt <= three_hours_ago:
                        user = booking.user
                        if user and user.telegram_id:
                            await send_review_reminder(
                                user_telegram_id=user.telegram_id,
                                client_name=booking.client_name or user.full_name or "Дорогой клиент"
                            )
                        booking.review_reminder_sent = True

                await db.commit()

        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Review reminder loop error: {e}", exc_info=True)

        await asyncio.sleep(10 * 60)  # Check every 10 minutes


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Create DB tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # 2. Seed initial data
    async with AsyncSessionLocal() as db:
        await seed_initial_data(db)

    # 3. Start Bot polling in background if token provided
    global bot_task, keep_alive_task, review_reminder_task
    if bot and not settings.TELEGRAM_BOT_TOKEN.startswith("7000000000"):
        set_bot_instance(bot)
        bot_task = asyncio.create_task(start_telegram_bot())
        logger.info("Telegram Bot polling task launched.")
    else:
        logger.info("Using mock/dev Bot token. Telegram Bot polling disabled for dev mode.")

    # 4. Start keep-alive background task
    keep_alive_task = asyncio.create_task(keep_alive_ping())
    logger.info("Keep-alive task started.")

    # 5. Start review reminder background task
    review_reminder_task = asyncio.create_task(review_reminder_loop())
    logger.info("Review reminder task started.")

    yield

    # Shutdown
    if bot_task:
        bot_task.cancel()
    if keep_alive_task:
        keep_alive_task.cancel()
    if review_reminder_task:
        review_reminder_task.cancel()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# CORS Middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.get("/health")
async def health_check():
    return {"status": "ok", "app": settings.PROJECT_NAME, "version": settings.VERSION}

@app.get("/ping")
async def ping():
    """Keep-alive endpoint"""
    return {"pong": True}

# Serve static files (covers, avatars)
static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "static"))
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Serve Frontend SPA
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/") or full_path.startswith("static/"):
            return JSONResponse(status_code=404, content={"detail": "Not found"})
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
