from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.services import router as services_router
from app.api.v1.schedule import router as schedule_router
from app.api.v1.bookings import router as bookings_router
from app.api.v1.portfolio import router as portfolio_router
from app.api.v1.settings import router as settings_router
from app.api.v1.admin import router as admin_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(services_router)
api_router.include_router(schedule_router)
api_router.include_router(bookings_router)
api_router.include_router(portfolio_router)
api_router.include_router(settings_router)
api_router.include_router(admin_router)
