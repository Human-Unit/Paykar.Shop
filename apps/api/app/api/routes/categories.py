from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.core.database import Session
from app.models import Category
from app.schemas.category import CategoryOut

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryOut])
async def categories(session: Session):
    return (await session.scalars(select(Category).order_by(Category.id))).all()


@router.get("/{slug}", response_model=CategoryOut)
async def category(slug: str, session: Session):
    result = await session.scalar(select(Category).where(Category.slug == slug))
    if result is None:
        raise HTTPException(404, "Category not found")
    return result
