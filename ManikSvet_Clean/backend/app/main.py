import asyncio
import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
import httpx

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

async def keep_alive_ping():
    """Ping self every 14 minutes to prevent Render free tier from sleeping"""
    webapp_url = settings.WEBAPP_URL
    # Build base URL for self-ping (use localhost in dev, or WEBAPP_URL in prod)
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

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Create DB tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # 2. Seed initial data
    async with AsyncSessionLocal() as db:
        await seed_initial_data(db)

    # 3. Start Bot polling in background if token provided
    global bot_task, keep_alive_task
    if bot and not settings.TELEGRAM_BOT_TOKEN.startswith("7000000000"):
        set_bot_instance(bot)
        bot_task = asyncio.create_task(dp.start_polling(bot, skip_updates=True))
        logger.info("Telegram Bot polling started successfully.")
    else:
        logger.info("Using mock/dev Bot token. Telegram Bot polling disabled for dev mode.")

    # 4. Start keep-alive background task
    keep_alive_task = asyncio.create_task(keep_alive_ping())
    logger.info("Keep-alive task started.")

    yield

    # Shutdown
    if bot_task:
        bot_task.cancel()
    if keep_alive_task:
        keep_alive_task.cancel()

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
    """Keep-alive endpoint for Render free tier to prevent cold starts"""
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
        # Don't intercept API or static paths
        if full_path.startswith("api/") or full_path.startswith("static/"):
            return JSONResponse(status_code=404, content={"detail": "Not found"})
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
