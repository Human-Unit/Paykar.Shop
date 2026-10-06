from decimal import Decimal
from typing import Annotated, Literal

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import case, func, or_, select
from sqlalchemy.orm import aliased

from app.core.database import Session
from app.models import Category, Product, ProductConnection
from app.schemas.product import (
    CatalogFacets,
    PricePreset,
    ProductConnectionBatch,
    ProductConnectionBatchIn,
    ProductConnectionGroup,
    ProductConnectionList,
    ProductOut,
    ProductPage,
)

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=ProductPage)
async def products(
    session: Session,
    q: Annotated[str, Query(max_length=200)] = "",
    category: Annotated[str | None, Query(max_length=160)] = None,
    subcategory: Annotated[str | None, Query(max_length=160)] = None,
    sort: Literal["name", "price_asc", "price_desc"] = "name",
    in_stock: bool = False,
    on_sale: bool = False,
    min_price: Annotated[Decimal | None, Query(ge=0, max_digits=12, decimal_places=2)] = None,
    max_price: Annotated[Decimal | None, Query(ge=0, max_digits=12, decimal_places=2)] = None,
    min_discount: Annotated[Decimal | None, Query(ge=0, le=100, allow_inf_nan=False)] = None,
    unit: Annotated[str | None, Query(max_length=40)] = None,
    include_facets: bool = False,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=48)] = 24,
    ids: Annotated[str | None, Query(max_length=2000)] = None,
):
    if min_price is not None and max_price is not None and min_price > max_price:
        raise HTTPException(422, "min_price must not exceed max_price")
    filters = [Product.is_active.is_(True)]
    if q.strip():
        term = q.strip().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        filters.append(or_(Product.name.ilike(f"%{term}%"), Product.sku.ilike(f"%{term}%")))
    for name, slug in (("category", category), ("subcategory", subcategory)):
        if not slug:
            continue
        tree = select(Category.id).where(Category.slug == slug).cte(f"{name}_tree", recursive=True)
        tree = tree.union(select(Category.id).join(tree, Category.parent_id == tree.c.id))
        filters.append(Product.category_id.in_(select(tree.c.id)))
    # Facets describe the current search/category scope, independent of price/stock selections.
    facet_filters = filters.copy()
    if in_stock:
        filters.append(Product.stock_quantity >= 1)
    if on_sale:
        filters.append(Product.old_price > Product.price)
    if min_discount is not None:
        filters.extend(
            [
                Product.old_price > Product.price,
                Product.price <= Product.old_price * (1 - min_discount / Decimal("100")),
            ]
        )
    if unit:
        filters.append(Product.unit == unit)
    if min_price is not None:
        filters.append(Product.price >= min_price)
    if max_price is not None:
        filters.append(Product.price <= max_price)
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
    items = [ProductOut.model_validate(p) for p in rows]
    facets = None
    if include_facets:
        stats = (
            await session.execute(
                select(
                    func.max(Product.price),
                    func.percentile_disc(0.25).within_group(Product.price),
                    func.percentile_disc(0.5).within_group(Product.price),
                    func.percentile_disc(0.75).within_group(Product.price),
                    func.array_agg(func.distinct(Product.unit)),
                ).where(*facet_filters)
            )
        ).one()
        maximum, *rest = stats
        breaks = sorted({value for value in rest[:3] if value is not None and value < maximum})
        presets = []
        lower = None
        for boundary in breaks:
            presets.append(PricePreset(min_price=lower, max_price=boundary))
            lower = boundary + Decimal("0.01")
        if breaks:
            presets.append(PricePreset(min_price=lower))
        facets = CatalogFacets(
            units=sorted(value for value in (stats[-1] or []) if value), price_presets=presets
        )
    return ProductPage(
        items=items,
        total=total or 0,
        page=page,
        page_size=page_size,
        facets=facets,
    )


@router.post("/connections", response_model=ProductConnectionBatch)
async def product_connections_batch(body: ProductConnectionBatchIn, session: Session):
    source_order = {slug: index for index, slug in enumerate(body.source_slugs)}
    target = aliased(Product)
    rows = await session.execute(
        select(Product.slug, ProductConnection.position, target)
        .join(ProductConnection, ProductConnection.source_product_id == Product.id)
        .join(target, ProductConnection.target_product_id == target.id)
        .where(
            Product.slug.in_(source_order),
            Product.is_active.is_(True),
            ProductConnection.is_active.is_(True),
            target.is_active.is_(True),
            target.stock_quantity >= 1,
        )
        .order_by(case(source_order, value=Product.slug), ProductConnection.position, target.id)
    )
    grouped: dict[str, list[ProductOut]] = {slug: [] for slug in body.source_slugs}
    for source_slug, _, target in rows:
        grouped[source_slug].append(ProductOut.model_validate(target))
    return ProductConnectionBatch(
        items=[
            ProductConnectionGroup(source_slug=slug, items=grouped[slug])
            for slug in body.source_slugs
        ]
    )


@router.get("/{slug}/connections", response_model=ProductConnectionList)
async def product_connections(slug: str, session: Session):
    source_id = await session.scalar(
        select(Product.id).where(Product.slug == slug, Product.is_active.is_(True))
    )
    if source_id is None:
        raise HTTPException(404, "Product not found")
    rows = await session.scalars(
        select(Product)
        .join(ProductConnection, ProductConnection.target_product_id == Product.id)
        .where(
            ProductConnection.source_product_id == source_id,
            ProductConnection.is_active.is_(True),
            Product.is_active.is_(True),
            Product.stock_quantity >= 1,
        )
        .order_by(ProductConnection.position, Product.id)
    )
    return ProductConnectionList(items=[ProductOut.model_validate(row) for row in rows])


@router.get("/{slug}", response_model=ProductOut)
async def product(slug: str, session: Session):
    row = await session.scalar(
        select(Product).where(Product.slug == slug, Product.is_active.is_(True))
    )
    if row is None:
        raise HTTPException(404, "Product not found")
    return row
