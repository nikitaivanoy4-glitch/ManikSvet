from typing import Dict, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.setting import Setting
from app.schemas.setting import SettingOut, SettingsUpdateDict
from app.api.deps import get_current_admin
from app.models.user import User

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("", response_model=Dict[str, str])
async def get_public_settings(db: AsyncSession = Depends(get_db)):
    """Returns key-value map of all settings for client / frontend UI"""
    result = await db.execute(select(Setting))
    settings_list = result.scalars().all()
    return {s.key: s.value for s in settings_list}

@router.get("/all", response_model=List[SettingOut])
async def get_all_settings_admin(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    result = await db.execute(select(Setting))
    return result.scalars().all()

@router.post("", response_model=Dict[str, str])
async def update_settings(
    settings_in: SettingsUpdateDict,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Admin endpoint to bulk update dynamic studio settings"""
    for key, val in settings_in.settings.items():
        res = await db.execute(select(Setting).where(Setting.key == key))
        setting = res.scalar_one_or_none()
        if setting:
            setting.value = str(val)
        else:
            db.add(Setting(key=key, value=str(val)))

    await db.commit()

    res_all = await db.execute(select(Setting))
    return {s.key: s.value for s in res_all.scalars().all()}
