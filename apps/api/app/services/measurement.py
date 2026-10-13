"""Canonical grocery conversion: integer grams, Decimal money, stock in base price units."""

from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal

from fastapi import HTTPException

from app.schemas.order import CartItem

MAX_WEIGHT_G = 99000


@dataclass(frozen=True)
class MeasuredLine:
    purchase_mode: str
    requested_piece_count: int | None
    requested_weight_g: int | None
    estimated_weight_g: int | None
    average_piece_weight_g_snapshot: int | None
    price_unit_snapshot: str
    quantity: Decimal
    unit_price: Decimal
    total_price: Decimal
    is_estimated: bool


def measure(product, item: CartItem) -> MeasuredLine:
    mode = item.purchase_mode
    if mode is None:
        # Legacy quantity meant multiples of the price unit. Preserve that meaning.
        mode = "PIECE" if product.price_unit == "PIECE" else "WEIGHT"
    pieces = (item.piece_count or item.quantity) if mode == "PIECE" else None
    weight = (
        (item.requested_weight_g or (item.quantity * 1000 if item.quantity else None))
        if mode == "WEIGHT"
        else None
    )
    if (mode == "WEIGHT" and product.measurement_mode == "PIECE") or (
        mode == "PIECE" and product.measurement_mode == "WEIGHT"
    ):
        raise HTTPException(422, "Purchase mode is not supported by this product")
    average = product.average_piece_weight_g if product.measurement_mode == "DUAL" else None
    estimated = pieces * average if pieces and average else weight
    if mode == "WEIGHT":
        if (
            weight < product.minimum_quantity
            or (weight - product.minimum_quantity) % product.quantity_step
        ):
            raise HTTPException(422, "Weight must respect the product minimum and step (grams)")
    elif product.measurement_mode == "PIECE" and pieces < product.minimum_quantity:
        raise HTTPException(422, "Piece count is below the product minimum")
    if estimated and estimated > MAX_WEIGHT_G:
        raise HTTPException(422, "At most 99000 grams per product")
    quantity = Decimal(estimated) / 1000 if product.price_unit == "KG" else Decimal(pieces)
    return MeasuredLine(
        purchase_mode=mode,
        requested_piece_count=pieces,
        requested_weight_g=weight,
        estimated_weight_g=estimated,
        average_piece_weight_g_snapshot=average,
        price_unit_snapshot=product.price_unit,
        quantity=quantity,
        unit_price=product.price,
        total_price=(product.price * quantity).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
        is_estimated=product.measurement_mode == "DUAL" and mode == "PIECE",
    )


def stock_limit(product, purchase_mode):
    """Count or grams available; retained stock storage is pieces or exact Decimal kg."""
    if not product.is_active:
        return 0
    if product.price_unit == "PIECE":
        count = min(99, int(product.stock_quantity))
        return count if count >= product.minimum_quantity else 0
    grams = int(product.stock_quantity * 1000)
    if purchase_mode == "PIECE":
        return min(
            99,
            grams // product.average_piece_weight_g,
            MAX_WEIGHT_G // product.average_piece_weight_g,
        )
    if grams < product.minimum_quantity:
        return 0
    grams = min(MAX_WEIGHT_G, grams)
    return (
        product.minimum_quantity
        + ((grams - product.minimum_quantity) // product.quantity_step) * product.quantity_step
    )
