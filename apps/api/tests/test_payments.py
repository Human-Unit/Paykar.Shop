import asyncio
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from uuid import UUID, uuid4

import pytest
from sqlalchemy import delete, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Order, Payment, Product
from tests import test_orders
from tests.test_orders import body

shop = test_orders.shop

pytestmark = pytest.mark.integration


async def payment(shop, **changes):
    request = body(shop, payment_method="card", idempotency_key=str(uuid4()), **changes)
    response = await shop[0].post("/api/v1/payments/sandbox/session", json=request)
    assert response.status_code == 201, response.text
    return request, response.json()


async def confirm(shop, record, scenario="SUCCESS"):
    return await shop[0].post(
        "/api/v1/payments/sandbox/confirm", json={"payment_id": record["id"], "scenario": scenario}
    )


async def cleanup_pending(shop, record):
    async with shop[1].begin() as session:
        await session.execute(delete(Payment).where(Payment.id == UUID(record["id"])))


async def test_success_persistence_consumed_session_and_reload(shop):
    request, record = await payment(shop)
    assert record["amount"] == "41.00" and record["currency"] == "TJS"
    assert record["status"] == "pending" and record["order_id"] is None
    assert "checkout" not in record and "phone" not in record
    async with shop[1]() as session:
        assert (
            await session.scalar(
                select(func.count()).select_from(Order).where(Order.customer_name == shop[3])
            )
            == 0
        )
    first = await confirm(shop, record)
    assert first.status_code == 200, first.text
    result = first.json()
    assert result["payment"]["status"] == "succeeded"
    order = result["order"]
    assert order["payment_method"] == "card" and order["payment_status"] == "paid"
    assert order["total"] == "41.00"
    assert (await confirm(shop, record, "DECLINED")).json() == result
    assert (await shop[0].get(f"/api/v1/orders/{order['id']}")).json() == order
    assert (await shop[0].get(f"/api/v1/payments/{record['id']}")).json() == result["payment"]
    replay = await shop[0].post("/api/v1/payments/sandbox/session", json=request)
    assert replay.json() == result["payment"] and len(shop[4]) == 1
    async with shop[1]() as session:
        assert (await session.get(Product, shop[2][0])).stock_quantity == 3
        assert (
            await session.scalar(
                select(func.count()).select_from(Order).where(Order.customer_name == shop[3])
            )
            == 1
        )


@pytest.mark.parametrize(
    "scenario,reason",
    [
        ("DECLINED", "declined"),
        ("INSUFFICIENT", "insufficient_funds"),
        ("ERROR", "processing_error"),
    ],
)
async def test_failure_persisted_no_order_retry(shop, scenario, reason):
    _, record = await payment(shop)
    failed = (await confirm(shop, record, scenario)).json()
    assert failed["order"] is None
    assert failed["payment"]["status"] == "failed" and failed["payment"]["failure_reason"] == reason
    assert (await shop[0].get(f"/api/v1/payments/{record['id']}")).json() == failed["payment"]
    async with shop[1]() as session:
        assert (await session.get(Product, shop[2][0])).stock_quantity == 5
        assert (
            await session.scalar(
                select(func.count()).select_from(Order).where(Order.customer_name == shop[3])
            )
            == 0
        )
    assert (await confirm(shop, record)).json()["order"] is not None
    assert len(shop[4]) == 1


async def test_duplicate_concurrent_confirmation(shop):
    _, record = await payment(shop)
    results = await asyncio.gather(
        confirm(shop, record), confirm(shop, record), confirm(shop, record)
    )
    assert all(response.status_code == 200 for response in results)
    assert len({response.json()["order"]["id"] for response in results}) == 1
    async with shop[1]() as session:
        assert (await session.get(Product, shop[2][0])).stock_quantity == 3


async def test_session_duplicate_and_mismatched_idempotency(shop):
    request, record = await payment(shop)
    responses = await asyncio.gather(
        *(shop[0].post("/api/v1/payments/sandbox/session", json=request) for _ in range(3))
    )
    assert all(response.json()["id"] == record["id"] for response in responses)
    response = await shop[0].post(
        "/api/v1/payments/sandbox/session", json={**request, "address": "Changed address"}
    )
    assert (
        response.status_code == 409 and response.json()["detail"]["code"] == "idempotency_conflict"
    )
    await cleanup_pending(shop, record)


async def test_incorrect_expected_amount(shop):
    response = await shop[0].post(
        "/api/v1/payments/sandbox/session",
        json=body(shop, payment_method="card", idempotency_key=str(uuid4()), expected_total="0.01"),
    )
    assert response.status_code == 409 and response.json()["detail"]["total"] == "41.00"


async def test_tampered_persisted_amount_rejected(shop):
    _, record = await payment(shop)
    async with shop[1].begin() as session:
        (await session.get(Payment, UUID(record["id"]))).amount = Decimal("1.00")
    response = await confirm(shop, record)
    assert (
        response.status_code == 409
        and response.json()["detail"]["code"] == "payment_amount_mismatch"
    )
    async with shop[1]() as session:
        assert (await session.get(Payment, UUID(record["id"]))).status == "pending"
        assert (await session.get(Product, shop[2][0])).stock_quantity == 5
    await cleanup_pending(shop, record)


async def test_changed_stock_rolls_back_payment(shop):
    _, record = await payment(shop)
    async with shop[1].begin() as session:
        (await session.get(Product, shop[2][0])).stock_quantity = 1
    response = await confirm(shop, record)
    assert response.status_code == 409 and response.json()["detail"]["code"] == "insufficient_stock"
    async with shop[1]() as session:
        stored = await session.get(Payment, UUID(record["id"]))
        assert stored.status == "pending" and stored.order_id is None
    await cleanup_pending(shop, record)


async def test_finalization_database_failure_is_atomic(shop, monkeypatch):
    _, record = await payment(shop)
    original = AsyncSession.flush

    async def fail(session, *args, **kwargs):
        if any(isinstance(item, Payment) and item.status == "succeeded" for item in session.dirty):
            raise IntegrityError("sandbox injected failure", {}, Exception("failure"))
        await original(session, *args, **kwargs)

    with monkeypatch.context() as context:
        context.setattr(AsyncSession, "flush", fail)
        response = await confirm(shop, record)
        assert response.status_code == 503
    async with shop[1]() as session:
        stored = await session.get(Payment, UUID(record["id"]))
        assert stored.status == "pending" and stored.order_id is None
        assert (await session.get(Product, shop[2][0])).stock_quantity == 5
        assert (
            await session.scalar(
                select(func.count()).select_from(Order).where(Order.customer_name == shop[3])
            )
            == 0
        )
    assert (await confirm(shop, record)).json()["order"] is not None


async def test_expiration_preserves_stock_and_persists_cancelled(shop):
    _, record = await payment(shop)
    async with shop[1].begin() as session:
        (await session.get(Payment, UUID(record["id"]))).expires_at = datetime.now(UTC) - timedelta(
            seconds=1
        )
    result = (await confirm(shop, record)).json()
    assert result["order"] is None and result["payment"]["status"] == "cancelled"
    assert result["payment"]["failure_reason"] == "session_expired"
    await cleanup_pending(shop, record)


async def test_no_card_values_reflected_or_stored_and_card_bypass_rejected(shop):
    request = body(shop, payment_method="card", idempotency_key=str(uuid4()))
    for route, payload in [
        ("/orders", request),
        ("/payments/sandbox/session", {**request, "card_number": "SECRET-SYNTHETIC", "cvv": "987"}),
        (
            "/payments/sandbox/confirm",
            {
                "payment_id": str(uuid4()),
                "scenario": "SUCCESS",
                "payment_success": True,
                "cvv": "987",
            },
        ),
    ]:
        response = await shop[0].post("/api/v1" + route, json=payload)
        assert response.status_code in (409, 422)
        assert "SECRET-SYNTHETIC" not in response.text and "987" not in response.text
    assert len(shop[4]) == 0


async def test_cash_idempotency_and_status(shop):
    request = body(shop, idempotency_key=str(uuid4()))
    results = await asyncio.gather(
        *(shop[0].post("/api/v1/orders", json=request) for _ in range(3))
    )
    assert all(response.status_code == 201 for response in results)
    assert len({response.json()["id"] for response in results}) == 1
    assert results[0].json()["payment_method"] == "cash"
    assert results[0].json()["payment_status"] == "due_on_delivery"
