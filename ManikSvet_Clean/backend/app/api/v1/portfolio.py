from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.portfolio import PortfolioItem
from app.schemas.portfolio import PortfolioOut, PortfolioCreate, PortfolioUpdate
from app.api.deps import get_current_admin
from app.models.user import User

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])

@router.get("", response_model=List[PortfolioOut])
async def get_portfolio_items(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PortfolioItem)
        .where(PortfolioItem.is_visible == True)
        .order_by(PortfolioItem.display_order.asc(), PortfolioItem.id.desc())
    )
    return result.scalars().all()

@router.get("/all", response_model=List[PortfolioOut])
async def get_all_portfolio_admin(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    result = await db.execute(
        select(PortfolioItem).order_by(PortfolioItem.display_order.asc(), PortfolioItem.id.desc())
    )
    return result.scalars().all()

@router.post("", response_model=PortfolioOut, status_code=status.HTTP_201_CREATED)
async def create_portfolio_item(
    item_in: PortfolioCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    item = PortfolioItem(**item_in.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item

@router.put("/{item_id}", response_model=PortfolioOut)
async def update_portfolio_item(
    item_id: int,
    item_in: PortfolioUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    result = await db.execute(select(PortfolioItem).where(PortfolioItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    update_data = item_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(item, field, val)

    await db.commit()
    await db.refresh(item)
    return item

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_portfolio_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    result = await db.execute(select(PortfolioItem).where(PortfolioItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    await db.delete(item)
    await db.commit()
    return None
