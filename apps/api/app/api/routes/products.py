from typing import Annotated, Literal

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import func, or_, select

from app.core.database import Session
from app.models import Category, Product
from app.schemas.product import ProductOut, ProductPage

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=ProductPage)
async def products(
    session: Session,
    q: Annotated[str, Query(max_length=200)] = "",
    category: str | None = None,
    sort: Literal["name", "price_asc", "price_desc"] = "name",
    in_stock: bool = False,
    on_sale: bool = False,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=48)] = 24,
    ids: Annotated[str | None, Query(max_length=2000)] = None,
):
    filters = [Product.is_active.is_(True)]
    if q.strip():
        term = q.strip().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        filters.append(or_(Product.name.ilike(f"%{term}%"), Product.sku.ilike(f"%{term}%")))
    if category:
        tree = (
            select(Category.id).where(Category.slug == category).cte("descendants", recursive=True)
        )
        tree = tree.union(select(Category.id).join(tree, Category.parent_id == tree.c.id))
        filters.append(Product.category_id.in_(select(tree.c.id)))
    if in_stock:
        filters.append(Product.stock_quantity >= 1)
    if on_sale:
        filters.append(Product.old_price > Product.price)
    if ids is not None:
        try:
            product_ids = [int(value) for value in ids.split(",") if value]
        except ValueError:
            raise HTTPException(422, "ids must be comma-separated positive integers") from None
        if not product_ids or len(product_ids) > 48 or any(v <= 0 for v in product_ids):
            raise HTTPException(422, "ids must contain 1 to 48 positive integers")
        filters.append(Product.id.in_(product_ids))
    total = await session.scalar(select(func.count()).select_from(Product).where(*filters))
    ordering = {
        "name": Product.name,
        "price_asc": Product.price,
        "price_desc": Product.price.desc(),
    }
    rows = await session.scalars(
        select(Product)
        .where(*filters)
        .order_by(ordering[sort], Product.id)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return ProductPage(
        items=[ProductOut.model_validate(p) for p in rows],
        total=total or 0,
        page=page,
        page_size=page_size,
    )


@router.get("/{slug}", response_model=ProductOut)
async def product(slug: str, session: Session):
    row = await session.scalar(
        select(Product).where(Product.slug == slug, Product.is_active.is_(True))
    )
    if row is None:
        raise HTTPException(404, "Product not found")
    return row
