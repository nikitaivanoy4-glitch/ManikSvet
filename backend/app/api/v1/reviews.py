from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.review import Review
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewOut
from app.api.deps import get_current_user, get_current_admin

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.get("", response_model=List[ReviewOut])
async def get_approved_reviews(db: AsyncSession = Depends(get_db)):
    """Public endpoint: returns only approved reviews, newest first"""
    res = await db.execute(
        select(Review)
        .where(Review.is_approved == True)
        .order_by(Review.created_at.desc())
    )
    return res.scalars().all()


@router.post("", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
async def create_review(
    review_in: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit a review — goes to moderation (is_approved=False by default)"""
    review = Review(
        user_id=current_user.id,
        author_name=review_in.author_name,
        rating=review_in.rating,
        text=review_in.text,
        is_approved=False,
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return review


# ── ADMIN ENDPOINTS ──────────────────────────────────────────────────────────

@router.get("/admin/all", response_model=List[ReviewOut])
async def get_all_reviews_admin(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Admin: all reviews including not yet approved"""
    res = await db.execute(select(Review).order_by(Review.created_at.desc()))
    return res.scalars().all()


@router.put("/admin/{review_id}/approve", response_model=ReviewOut)
async def approve_review(
    review_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Admin: approve review so it becomes publicly visible"""
    res = await db.execute(select(Review).where(Review.id == review_id))
    review = res.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Отзыв не найден")
    review.is_approved = True
    await db.commit()
    await db.refresh(review)
    return review


@router.delete("/admin/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Admin: permanently delete review"""
    res = await db.execute(select(Review).where(Review.id == review_id))
    review = res.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Отзыв не найден")
    await db.delete(review)
    await db.commit()
    return None
