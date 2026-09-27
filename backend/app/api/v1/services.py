from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.service import Service
from app.schemas.service import ServiceOut, ServiceCreate, ServiceUpdate
from app.api.deps import get_current_user, get_current_admin
from app.models.user import User

router = APIRouter(prefix="/services", tags=["Services"])

@router.get("", response_model=List[ServiceOut])
async def get_services(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Service).where(Service.is_active == True).order_by(Service.display_order.asc(), Service.id.asc())
    )
    return result.scalars().all()

@router.get("/all", response_model=List[ServiceOut])
async def get_all_services_admin(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    result = await db.execute(select(Service).order_by(Service.display_order.asc(), Service.id.asc()))
    return result.scalars().all()

@router.post("", response_model=ServiceOut, status_code=status.HTTP_201_CREATED)
async def create_service(
    service_in: ServiceCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    service = Service(**service_in.model_dump())
    db.add(service)
    await db.commit()
    await db.refresh(service)
    return service

@router.put("/{service_id}", response_model=ServiceOut)
async def update_service(
    service_id: int,
    service_in: ServiceUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    result = await db.execute(select(Service).where(Service.id == service_id))
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    update_data = service_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(service, field, val)

    await db.commit()
    await db.refresh(service)
    return service

@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_service(
    service_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    result = await db.execute(select(Service).where(Service.id == service_id))
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    service.is_active = False # Soft delete
    await db.commit()
    return None
