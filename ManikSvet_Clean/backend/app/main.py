import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from app.core.config import settings
from app.core.database import engine, Base, AsyncSessionLocal
from app.core.init_db import seed_initial_data
from app.api.router import api_router
from app.api.v1.bookings import set_bot_instance
from app.bot.bot import bot, dp

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

bot_task = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Create DB tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # 2. Seed initial data
    async with AsyncSessionLocal() as db:
        await seed_initial_data(db)

    # 3. Start Bot polling in background if token provided
    global bot_task
    if bot and not settings.TELEGRAM_BOT_TOKEN.startswith("7000000000"):
        set_bot_instance(bot)
        bot_task = asyncio.create_task(dp.start_polling(bot, skip_updates=True))
        logger.info("Telegram Bot polling started successfully.")
    else:
        logger.info("Using mock/dev Bot token. Telegram Bot polling disabled for dev mode.")

    yield

    # Shutdown
    if bot_task:
        bot_task.cancel()

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
            return None
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
