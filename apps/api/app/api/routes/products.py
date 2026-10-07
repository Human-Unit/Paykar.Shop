from decimal import Decimal
from typing import Annotated, Literal

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import func, or_, select

from app.core.database import Session
from app.models import Category, Product, ProductConnection
from app.schemas.product import ProductOut, ProductPage

router = APIRouter(prefix="/products", tags=["products"])


def parse_product_ids(raw: str) -> list[int]:
    try:
        values = [int(value) for value in raw.split(",") if value]
    except ValueError:
        raise HTTPException(422, "ids must be comma-separated positive integers") from None
    if not values or len(values) > 48 or any(value <= 0 for value in values):
        raise HTTPException(422, "ids must contain 1 to 48 positive integers")
    seen: set[int] = set()
    unique: list[int] = []
    for value in values:
        if value not in seen:
            seen.add(value)
            unique.append(value)
    return unique


@router.get("", response_model=ProductPage)
async def products(
    session: Session,
    q: Annotated[str, Query(max_length=200)] = "",
    category: str | None = None,
    sort: Literal["name", "price_asc", "price_desc"] = "name",
    in_stock: bool = False,
    on_sale: bool = False,
    min_price: Annotated[Decimal | None, Query(ge=0)] = None,
    max_price: Annotated[Decimal | None, Query(ge=0)] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=48)] = 24,
    ids: Annotated[str | None, Query(max_length=2000)] = None,
):
    if min_price is not None and max_price is not None and min_price > max_price:
        raise HTTPException(422, "min_price must be less than or equal to max_price")

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
    if min_price is not None:
        filters.append(Product.price >= min_price)
    if max_price is not None:
        filters.append(Product.price <= max_price)
    if ids is not None:
        filters.append(Product.id.in_(parse_product_ids(ids)))
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


@router.get("/cart-assistance", response_model=list[ProductOut])
async def cart_assistance(
    session: Session,
    ids: Annotated[str, Query(max_length=2000)],
    limit: Annotated[int, Query(ge=1, le=12)] = 4,
):
    source_ids = parse_product_ids(ids)
    rows = (
        await session.execute(
            select(ProductConnection.source_product_id, Product)
            .join(Product, Product.id == ProductConnection.target_product_id)
            .where(
                ProductConnection.source_product_id.in_(source_ids),
                ProductConnection.relation_type == "complementary",
                ProductConnection.is_active.is_(True),
                Product.is_active.is_(True),
                Product.stock_quantity >= 1,
                Product.id.not_in(source_ids),
            )
            .order_by(ProductConnection.position, ProductConnection.id)
        )
    ).all()

    grouped: dict[int, list[Product]] = {}
    for source_id, target in rows:
        grouped.setdefault(source_id, []).append(target)

    seen = set(source_ids)
    result: list[Product] = []
    for source_id in source_ids:
        for target in grouped.get(source_id, []):
            if target.id in seen:
                continue
            seen.add(target.id)
            result.append(target)
            if len(result) >= limit:
                return result
    return result


@router.get("/{slug}/connections", response_model=list[ProductOut])
async def product_connections(
    slug: str,
    session: Session,
    relation_type: Literal["complementary", "substitute"] = "complementary",
    limit: Annotated[int, Query(ge=1, le=12)] = 4,
):
    source = await session.scalar(
        select(Product).where(Product.slug == slug, Product.is_active.is_(True))
    )
    if source is None:
        raise HTTPException(404, "Product not found")

    rows = await session.scalars(
        select(Product)
        .join(ProductConnection, Product.id == ProductConnection.target_product_id)
        .where(
            ProductConnection.source_product_id == source.id,
            ProductConnection.relation_type == relation_type,
            ProductConnection.is_active.is_(True),
            Product.is_active.is_(True),
            Product.stock_quantity >= 1,
        )
        .order_by(ProductConnection.position, ProductConnection.id)
        .limit(limit)
    )
    return list(rows)


@router.get("/{slug}", response_model=ProductOut)
async def product(slug: str, session: Session):
    row = await session.scalar(
        select(Product).where(Product.slug == slug, Product.is_active.is_(True))
    )
    if row is None:
        raise HTTPException(404, "Product not found")
    return row
