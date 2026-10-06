from datetime import timezone, datetime, timedelta
from uuid import UUID, uuid4

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payment import Payment
from app.payments.provider import PaymentProvider, SandboxPaymentProvider
from app.payments.schemas import Confirm, Confirmation, PaymentOut, SessionCreate
from app.schemas.delivery import DeliveryPoint, DeliveryQuote
from app.schemas.order import OrderCreate
from app.services.delivery_service import DeliveryService, delivery_price
from app.services.order_service import (
    checkout_values,
    conflict,
    finalize_order,
    fingerprint,
    get_order,
    lock_key,
    quantities_for,
)


def bound(payment: Payment, body: SessionCreate) -> PaymentOut:
    if payment.request_fingerprint != fingerprint(body):
        raise conflict("idempotency_conflict", "Данные заказа изменились. Повторите оформление.")
    return PaymentOut.model_validate(payment)


async def create_session(
    body: SessionCreate, session: AsyncSession, delivery: DeliveryService
) -> PaymentOut:
    quantities_for(body)
    # An idempotent replay requires no new route request. Never wait for ORS inside a transaction.
    async with session.begin():
        previous = await session.scalar(
            select(Payment).where(Payment.idempotency_key == body.idempotency_key)
        )
        if previous:
            return bound(previous, body)
    quote = await delivery.quote(
        DeliveryPoint(address=body.address, latitude=body.latitude, longitude=body.longitude)
    )
    async with session.begin():
        await lock_key(session, body.idempotency_key)
        previous = await session.scalar(
            select(Payment).where(Payment.idempotency_key == body.idempotency_key)
        )
        if previous:
            return bound(previous, body)
        _, _, _, total = await checkout_values(body, session, quote)
        payment = Payment(
            idempotency_key=body.idempotency_key,
            request_fingerprint=fingerprint(body),
            amount=total,
            checkout=body.model_dump(mode="json"),
            quote=quote.model_dump(mode="json"),
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
        )
        session.add(payment)
        await session.flush()
        return PaymentOut.model_validate(payment)


async def confirm(
    body: Confirm,
    session: AsyncSession,
    delivery: DeliveryService,
    provider: PaymentProvider | None = None,
) -> Confirmation:
    decision = (provider or SandboxPaymentProvider()).confirm(body.scenario)
    async with session.begin():
        payment = await session.scalar(
            select(Payment).where(Payment.id == body.payment_id).with_for_update()
        )
        if payment is None:
            raise HTTPException(
                404, detail={"code": "payment_not_found", "message": "Платёжная сессия не найдена."}
            )
        if payment.order_id is not None:
            # A consumed session cannot produce another order; retries return its original result.
            return Confirmation(
                payment=PaymentOut.model_validate(payment),
                order=await get_order(payment.order_id, session),
            )
        if payment.expires_at <= datetime.now(timezone.utc):
            payment.status, payment.failure_reason = "cancelled", "session_expired"
            await session.flush()
            return Confirmation(payment=PaymentOut.model_validate(payment))
        if (
            payment.status not in ("pending", "failed")
            or payment.provider != "sandbox"
            or payment.method != "card"
        ):
            raise conflict(
                "payment_invalid", "Платёжная сессия недействительна. Повторите оформление."
            )
        checkout = OrderCreate.model_validate(payment.checkout)
        if (
            payment.currency != "TJS"
            or payment.amount != checkout.expected_total
            or payment.request_fingerprint != fingerprint(checkout)
        ):
            raise conflict(
                "payment_amount_mismatch", "Сумма оплаты изменилась. Повторите оформление."
            )
        if not decision.succeeded:
            payment.status, payment.failure_reason = "failed", decision.reason
            await session.flush()
            return Confirmation(payment=PaymentOut.model_validate(payment))
        quote = DeliveryQuote.model_validate(payment.quote)
        # Recheck current fee and prices against the verified server route snapshot.
        quote = quote.model_copy(update={"delivery_price": delivery_price(delivery.settings)})
        if quote.distance_meters > delivery.settings.delivery_max_distance_meters:
            raise conflict(
                "delivery_changed", "Условия доставки изменились. Рассчитайте доставку снова."
            )
        order = await finalize_order(checkout, session, quote, paid=True)
        payment.status, payment.failure_reason = "succeeded", None
        payment.provider_reference = f"sandbox-{uuid4()}"
        payment.order_id = order.id
        await session.flush()
        return Confirmation(payment=PaymentOut.model_validate(payment), order=order)


async def detail(payment_id: UUID, session: AsyncSession) -> PaymentOut:
    payment = await session.get(Payment, payment_id)
    if payment is None:
        raise HTTPException(
            404, detail={"code": "payment_not_found", "message": "Платёжная сессия не найдена."}
        )
    return PaymentOut.model_validate(payment)
