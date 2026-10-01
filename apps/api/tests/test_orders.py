import asyncio
import os
from contextvars import ContextVar
from decimal import Decimal
from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient, MockTransport, Response
from sqlalchemy import delete, func, select
from sqlalchemy.engine import make_url
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.database import get_session
from app.main import create_app
from app.models import Category, Order, OrderItem, Product
from app.services.delivery_service import DeliveryError, DeliveryService, get_delivery_service
from tests.test_delivery import configured, provider_route

pytestmark = pytest.mark.integration


@pytest_asyncio.fixture
async def shop():
    url = os.getenv("TEST_DATABASE_URL")
    if not url:
        pytest.fail(
            "Required: TEST_DATABASE_URL pointing to a migrated dedicated PostgreSQL test DB"
        )
    assert make_url(url).database.endswith("_test"), "Never run order fixtures on the demo DB"
    engine = create_async_engine(url, poolclass=NullPool)
    sessions = async_sessionmaker(engine, expire_on_commit=False)
    token = f"order-test-{uuid4()}"
    async with sessions.begin() as session:
        category = Category(name="Test orders", slug=token)
        session.add(category)
        await session.flush()
        products = [
            Product(
                category_id=category.id,
                name=f"Snapshot {i}",
                slug=f"{token}-{i}",
                sku=f"{token}-{i}",
                price=Decimal("10.50"),
                unit="pack",
                stock_quantity=5,
                is_active=i != 2,
            )
            for i in range(3)
        ]
        session.add_all(products)
        await session.flush()
        ids = [p.id for p in products]
        category_id = category.id
    app = create_app(configured())
    active_session = ContextVar("order_test_session")

    async def session_override():
        async with sessions() as session:
            token = active_session.set(session)
            try:
                yield session
            finally:
                active_session.reset(token)

    app.dependency_overrides[get_session] = session_override
    calls = []

    async def handler(request):
        # Provider work must precede any order transaction or row locks.
        calls.append(request)
        assert not active_session.get().in_transaction()
        return Response(200, json=provider_route())

    async with AsyncClient(transport=MockTransport(handler)) as upstream:
        service = DeliveryService(configured(), upstream)
        app.dependency_overrides[get_delivery_service] = lambda: service
        async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
            yield client, sessions, ids, token, calls
    async with sessions.begin() as session:
        await session.execute(delete(Order).where(Order.customer_name == token))
        await session.execute(delete(Product).where(Product.id.in_(ids)))
        await session.execute(delete(Category).where(Category.id == category_id))
    await engine.dispose()


def body(shop, **changes):
    return {
        "customer_name": shop[3],
        "phone": "+992 900 000 000",
        "address": "Test street 80",
        "latitude": 38.57,
        "longitude": 68.78,
        "items": [{"product_id": shop[2][0], "quantity": 2}],
        "expected_total": "41.00",
        **changes,
    }


async def test_success_snapshots_retrieval(shop):
    client, sessions, ids, _, calls = shop
    response = await client.post("/api/v1/orders", json=body(shop))
    assert response.status_code == 201, response.text
    order = response.json()
    assert order["subtotal"] == "21.00" and order["total"] == "41.00"
    assert order["items"][0]["unit_price"] == "10.50"
    assert "phone" not in order
    async with sessions.begin() as session:
        product = await session.get(Product, ids[0])
        assert product.stock_quantity == 3
        product.price = Decimal("99.00")
        product.name = "Changed product"
    fetched = await client.get(f"/api/v1/orders/{order['id']}")
    assert fetched.status_code == 200
    assert fetched.json() == order
    assert len(calls) == 1
    assert (await client.get("/api/v1/orders")).status_code == 405
    assert (await client.get(f"/api/v1/orders/{uuid4()}")).status_code == 404


@pytest.mark.parametrize(
    "changes",
    [
        {"items": []},
        {"items": [{"product_id": 1, "quantity": 0}]},
        {"items": [{"product_id": 1, "quantity": 1.5}]},
        {"phone": "not a phone"},
        {"customer_name": " "},
        {"address": "x"},
        {"latitude": 91},
        {"subtotal": "0.01"},
        {"items": [{"product_id": 1, "quantity": 1, "unit_price": "0.01"}]},
    ],
)
async def test_invalid_input_tampered_prices(shop, changes):
    response = await shop[0].post("/api/v1/orders", json=body(shop, **changes))
    assert response.status_code == 422, response.text
    assert len(shop[4]) == 0


@pytest.mark.parametrize(
    "kind,code",
    [
        ("missing", "missing_product"),
        ("inactive", "inactive_product"),
        ("stock", "insufficient_stock"),
        ("total", "total_changed"),
    ],
)
async def test_conflict_atomic_rollback(shop, kind, code):
    client, sessions, ids, token, _ = shop
    request = body(shop)
    if kind == "missing":
        request["items"].append({"product_id": 9223372036854775807, "quantity": 1})
    if kind == "inactive":
        request["items"].append({"product_id": ids[2], "quantity": 1})
    if kind == "stock":
        request["items"].append({"product_id": ids[1], "quantity": 6})
    if kind == "total":
        request["expected_total"] = "0.01"
    response = await client.post("/api/v1/orders", json=request)
    assert response.status_code == 409, response.text
    assert response.json()["detail"]["code"] == code
    if kind == "total":
        assert response.json()["detail"]["total"] == "41.00"
        assert response.json()["detail"]["items"][0]["unit_price"] == "10.50"
    async with sessions() as session:
        assert (
            await session.scalar(
                select(func.count()).select_from(Order).where(Order.customer_name == token)
            )
            == 0
        )
        assert (
            await session.scalar(
                select(func.count()).select_from(OrderItem).where(OrderItem.product_id.in_(ids))
            )
            == 0
        )
        assert (await session.get(Product, ids[0])).stock_quantity == 5


async def test_concurrent_last_item(shop):
    client, sessions, ids, token, _ = shop
    async with sessions.begin() as session:
        (await session.get(Product, ids[0])).stock_quantity = 1
    request = body(shop, items=[{"product_id": ids[0], "quantity": 1}], expected_total="30.50")
    responses = await asyncio.gather(
        client.post("/api/v1/orders", json=request), client.post("/api/v1/orders", json=request)
    )
    assert sorted(r.status_code for r in responses) == [201, 409]
    async with sessions() as session:
        assert (await session.get(Product, ids[0])).stock_quantity == 0
        assert (
            await session.scalar(
                select(func.count()).select_from(Order).where(Order.customer_name == token)
            )
            == 1
        )


async def test_duplicate_product_lines_are_aggregated(shop):
    request = body(shop, items=[{"product_id": shop[2][0], "quantity": 1}] * 2)
    response = await shop[0].post("/api/v1/orders", json=request)
    assert response.status_code == 201, response.text
    assert len(response.json()["items"]) == 1
    assert Decimal(response.json()["items"][0]["quantity"]) == 2


async def test_database_failure_after_order_insert_rolls_back(shop, monkeypatch):
    original_flush = AsyncSession.flush

    async def fail_items(session, *args, **kwargs):
        if any(isinstance(item, OrderItem) for item in session.new):
            raise IntegrityError("private SQL", {}, Exception("private database details"))
        return await original_flush(session, *args, **kwargs)

    monkeypatch.setattr(AsyncSession, "flush", fail_items)
    response = await shop[0].post("/api/v1/orders", json=body(shop))
    assert response.status_code == 503
    assert "private" not in response.text
    async with shop[1]() as session:
        assert (
            await session.scalar(
                select(func.count()).select_from(Order).where(Order.customer_name == shop[3])
            )
            == 0
        )
        assert (
            await session.scalar(
                select(func.count()).select_from(OrderItem).where(OrderItem.product_id.in_(shop[2]))
            )
            == 0
        )
        assert (await session.get(Product, shop[2][0])).stock_quantity == 5


async def test_provider_failure_does_not_write(shop, monkeypatch):
    async def unavailable(service, point):
        raise DeliveryError(504, "route_timeout", "Повторите расчёт маршрута.")

    monkeypatch.setattr(DeliveryService, "quote", unavailable)
    response = await shop[0].post("/api/v1/orders", json=body(shop))
    assert response.status_code == 504
    async with shop[1]() as session:
        assert (
            await session.scalar(
                select(func.count()).select_from(Order).where(Order.customer_name == shop[3])
            )
            == 0
        )
        assert (await session.get(Product, shop[2][0])).stock_quantity == 5


async def test_review_and_resubmit_changed_price(shop):
    async with shop[1].begin() as session:
        (await session.get(Product, shop[2][0])).price = Decimal("12.50")
    rejected = await shop[0].post("/api/v1/orders", json=body(shop))
    assert rejected.status_code == 409
    refreshed = rejected.json()["detail"]["total"]
    assert refreshed == "45.00"
    accepted = await shop[0].post("/api/v1/orders", json=body(shop, expected_total=refreshed))
    assert accepted.status_code == 201
    assert accepted.json()["items"][0]["unit_price"] == "12.50"
