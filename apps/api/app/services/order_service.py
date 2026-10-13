import hashlib
import json
from dataclasses import asdict
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.schemas.delivery import DeliveryPoint, DeliveryQuote
from app.schemas.order import CartItem, OrderCreate, OrderItemOut, OrderOut
from app.services.delivery_service import DeliveryService
from app.services.measurement import measure


def conflict(code: str, message: str, **details: object) -> HTTPException:
    return HTTPException(409, detail={"code": code, "message": message, **details})


def fingerprint(body: OrderCreate) -> str:
    data = body.model_dump(mode="json", exclude={"idempotency_key"})
    data["items"] = [item.model_dump(exclude_none=True) for item in body.items]
    return hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()


async def lock_key(session: AsyncSession, key: UUID) -> None:
    await session.execute(select(func.pg_advisory_xact_lock(key.int % (2**63))))


async def existing_order(body: OrderCreate, session: AsyncSession) -> OrderOut | None:
    if body.idempotency_key is None:
        return None
    order = await session.scalar(select(Order).where(Order.idempotency_key == body.idempotency_key))
    if order is None:
        return None
    if order.request_fingerprint != fingerprint(body):
        raise conflict("idempotency_conflict", "Данные заказа изменились. Повторите оформление.")
    return await get_order(order.id, session)


async def create_order(
    body: OrderCreate, session: AsyncSession, delivery: DeliveryService
) -> OrderOut:
    quantities_for(body)
    if body.payment_method != "cash":
        raise conflict("payment_required", "Для оплаты картой подтвердите платёжную сессию.")
    if body.idempotency_key is not None:
        async with session.begin():
            prior = await existing_order(body, session)
            if prior:
                return prior
    # Provider work happens before the order transaction and stock locks.
    quote = await delivery.quote(
        DeliveryPoint(address=body.address, latitude=body.latitude, longitude=body.longitude)
    )
    async with session.begin():
        if body.idempotency_key is not None:
            await lock_key(session, body.idempotency_key)
            prior = await existing_order(body, session)
            if prior:
                return prior
        return await finalize_order(body, session, quote)


def quantities_for(body: OrderCreate) -> dict[int, CartItem]:
    quantities: dict[int, CartItem] = {}
    for item in body.items:
        existing = quantities.get(item.product_id)
        if existing is None:
            quantities[item.product_id] = item.model_copy()
            continue
        if existing.purchase_mode != item.purchase_mode:
            raise HTTPException(422, "One purchase mode per product is required")
        field = (
            "quantity"
            if item.purchase_mode is None
            else "piece_count"
            if item.purchase_mode == "PIECE"
            else "requested_weight_g"
        )
        combined = getattr(existing, field) + getattr(item, field)
        if combined > (99000 if field == "requested_weight_g" else 99):
            raise HTTPException(422, "Quantity exceeds the per-product limit")
        quantities[item.product_id] = existing.model_copy(update={field: combined})
    return quantities


async def checkout_values(body: OrderCreate, session: AsyncSession, quote: DeliveryQuote):
    quantities = quantities_for(body)
    products = (
        await session.scalars(
            select(Product)
            .where(Product.id.in_(sorted(quantities)))
            .order_by(Product.id)
            .with_for_update()
        )
    ).all()
    if len(products) != len(quantities):
        raise conflict("missing_product", "Товар больше недоступен. Проверьте корзину.")
    measured = {p.id: measure(p, quantities[p.id]) for p in products}
    for product in products:
        if not product.is_active:
            raise conflict("inactive_product", "Товар больше недоступен. Проверьте корзину.")
        if product.stock_quantity < measured[product.id].quantity:
            raise conflict(
                "insufficient_stock",
                f"Недостаточно товара «{product.name}». Измените количество в корзине.",
                product_id=product.id,
                available_quantity=str(product.stock_quantity),
            )
    snapshots = [
        OrderItemOut(product_id=p.id, product_name=p.name, **asdict(measured[p.id]))
        for p in products
    ]
    subtotal = sum((item.total_price for item in snapshots), Decimal("0.00"))
    total = subtotal + quote.delivery_price
    if total > Decimal("9999999999.99"):
        raise conflict("total_too_large", "Сумма заказа слишком велика. Уменьшите корзину.")
    if total != body.expected_total:
        raise conflict(
            "total_changed",
            "Стоимость изменилась. Проверьте обновлённый итог и подтвердите ещё раз.",
            subtotal=f"{subtotal:.2f}",
            delivery_price=f"{quote.delivery_price:.2f}",
            total=f"{total:.2f}",
            items=[item.model_dump(mode="json") for item in snapshots],
            quote=quote.model_dump(mode="json"),
        )
    return products, snapshots, subtotal, total


async def finalize_order(
    body: OrderCreate, session: AsyncSession, quote: DeliveryQuote, *, paid: bool = False
) -> OrderOut:
    products, snapshots, subtotal, total = await checkout_values(body, session, quote)
    order = Order(
        customer_name=body.customer_name,
        phone=body.phone,
        address=body.address,
        comment=body.comment,
        latitude=body.latitude,
        longitude=body.longitude,
        subtotal=subtotal,
        delivery_price=quote.delivery_price,
        total=total,
        distance_meters=quote.distance_meters,
        delivery_duration_seconds=quote.duration_seconds,
        status="pending",
        payment_method=body.payment_method,
        payment_status="paid" if paid else "due_on_delivery",
        idempotency_key=body.idempotency_key,
        request_fingerprint=fingerprint(body),
    )
    session.add(order)
    await session.flush()
    for product, item in zip(products, snapshots, strict=True):
        session.add(
            OrderItem(
                order_id=order.id,
                **item.model_dump(exclude={"estimated_line_total", "final_line_total"}),
            )
        )
        product.stock_quantity -= item.quantity
    await session.flush()
    result = OrderOut(
        **{name: getattr(order, name) for name in OrderOut.model_fields if name != "items"},
        items=snapshots,
    )
    return result


async def get_order(order_id: UUID, session: AsyncSession) -> OrderOut:
    order = await session.get(Order, order_id)
    if order is None:
        raise HTTPException(404, detail={"code": "order_not_found", "message": "Заказ не найден."})
    items = (
        await session.scalars(
            select(OrderItem).where(OrderItem.order_id == order_id).order_by(OrderItem.id)
        )
    ).all()
    return OrderOut(
        **{name: getattr(order, name) for name in OrderOut.model_fields if name != "items"},
        items=[OrderItemOut.model_validate(item) for item in items],
    )
