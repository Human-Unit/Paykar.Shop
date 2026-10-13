import json
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Product
from app.schemas.order import CartItem
from app.schemas.product import ProductOut
from app.schemas.shopping import (
    CuratedDefinition,
    CuratedTemplate,
    ShoppingPreview,
    ShoppingPreviewItem,
)
from app.services.measurement import measure, stock_limit


def load_curated(path: Path | None = None) -> list[CuratedDefinition]:
    if path is None:
        directory = (
            Path("/seed")
            if Path("/seed").is_dir()
            else Path(__file__).resolve().parents[4] / "db/seed"
        )
        path = directory / "shopping_templates.json"
    definitions = [
        CuratedDefinition.model_validate(row) for row in json.loads(path.read_text("utf-8"))
    ]
    if len({row.slug for row in definitions}) != len(definitions):
        raise ValueError("Duplicate curated template slug")
    for row in definitions:
        if len({item.product_slug for item in row.items}) != len(row.items):
            raise ValueError(f"Duplicate product in template: {row.slug}")
    return definitions


def validate_curated(definitions: list[CuratedDefinition], product_slugs: set[str]) -> None:
    unknown = {item.product_slug for row in definitions for item in row.items} - product_slugs
    if unknown:
        raise ValueError(
            f"Shopping template references unknown product slugs: {', '.join(sorted(unknown))}"
        )


def preview_item(
    product: Product | None, product_id: int, quantity: int, item: CartItem | None = None
) -> ShoppingPreviewItem:
    measured = (
        measure(product, item or CartItem(product_id=max(1, product_id), quantity=quantity))
        if product
        else None
    )
    mode = measured.purchase_mode if measured else None
    requested = (
        (measured.requested_piece_count if mode == "PIECE" else measured.requested_weight_g)
        if measured
        else quantity
    )
    available = stock_limit(product, mode) if product else 0
    allowed = max(0, min(requested, available))
    if product and mode == "WEIGHT" and allowed >= product.minimum_quantity:
        allowed = (
            product.minimum_quantity
            + ((allowed - product.minimum_quantity) // product.quantity_step)
            * product.quantity_step
        )
    elif product and mode == "WEIGHT":
        allowed = 0
    pricing = (
        measure(
            product,
            CartItem(
                product_id=product_id,
                purchase_mode=mode,
                **(
                    {"piece_count": allowed} if mode == "PIECE" else {"requested_weight_g": allowed}
                ),
            ),
        )
        if allowed
        else None
    )
    return ShoppingPreviewItem(
        product_id=product_id,
        requested_quantity=requested,
        available_quantity=allowed,
        availability="missing"
        if product is None
        else "available"
        if available > 0
        else "unavailable",
        product=ProductOut.model_validate(product) if product and product.is_active else None,
        purchase_mode=mode,
        estimated_weight_g=measured.estimated_weight_g if measured else None,
        is_estimated=measured.is_estimated if measured else False,
        estimated_total=f"{pricing.total_price:.2f}" if pricing else "0.00",
    )


async def preview_items(items: list[CartItem], session: AsyncSession) -> ShoppingPreview:
    rows = await session.scalars(
        select(Product).where(Product.id.in_([item.product_id for item in items]))
    )
    products = {product.id: product for product in rows}
    return ShoppingPreview(
        items=[
            preview_item(
                products.get(item.product_id),
                item.product_id,
                item.quantity or item.piece_count or item.requested_weight_g,
                item,
            )
            for item in items
        ]
    )


async def curated_templates(session: AsyncSession) -> list[CuratedTemplate]:
    definitions = load_curated()
    slugs = {item.product_slug for row in definitions for item in row.items}
    products = {
        product.slug: product
        for product in await session.scalars(select(Product).where(Product.slug.in_(slugs)))
    }
    # Seed validation rejects unknown references. If a product later disappears,
    # retain its template row as missing instead of inventing a replacement.
    return [
        CuratedTemplate(
            id=row.slug,
            name=row.name,
            description=row.description,
            items=[
                preview_item(
                    products.get(item.product_slug),
                    products[item.product_slug].id if item.product_slug in products else 0,
                    item.quantity,
                )
                for item in row.items
            ],
        )
        for row in definitions
    ]
