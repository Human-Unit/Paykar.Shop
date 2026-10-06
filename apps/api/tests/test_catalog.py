import os
from decimal import Decimal

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import Settings
from app.core.database import get_session
from app.main import create_app
from app.models import Category, Product

pytestmark = pytest.mark.integration


@pytest_asyncio.fixture
async def client():
    url = os.getenv("TEST_DATABASE_URL")
    if not url:
        pytest.skip("BLOCKED: set TEST_DATABASE_URL to a migrated dedicated PostgreSQL database")
    engine = create_async_engine(url, poolclass=NullPool)
    async with engine.connect() as connection:
        transaction = await connection.begin()
        async with AsyncSession(bind=connection) as session:
            parent = Category(name="Test produce", slug="test-produce")
            session.add(parent)
            await session.flush()
            child = Category(name="Test fruit", slug="test-fruit", parent_id=parent.id)
            session.add(child)
            await session.flush()
            for name, price, active, stock, slug in [
                ("Apple test", "10.50", True, 5, "test-apple"),
                ("Banana test", "20.00", True, 0, "test-banana"),
                ("Hidden test", "1.00", False, 5, "test-hidden"),
            ]:
                session.add(
                    Product(
                        category_id=child.id,
                        name=name,
                        slug=slug,
                        sku=slug.upper(),
                        price=Decimal(price),
                        unit="pack",
                        stock_quantity=stock,
                        is_active=active,
                    )
                )
            await session.flush()

            async def override():
                yield session

            app = create_app(Settings(_env_file=None))
            app.dependency_overrides[get_session] = override
            async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
            ) as http:
                yield http
        await transaction.rollback()
    await engine.dispose()


async def test_categories(client):
    rows = (await client.get("/api/v1/categories")).json()
    assert len(rows) == 2
    assert rows[1]["parent_id"] == rows[0]["id"]
    assert (await client.get("/api/v1/categories/test-fruit")).json()["name"] == "Test fruit"
    assert (await client.get("/api/v1/categories/missing")).status_code == 404


async def test_product_detail_and_inactive(client):
    response = await client.get("/api/v1/products/test-apple")
    assert response.status_code == 200
    assert response.json()["price"] == "10.50"
    assert (await client.get("/api/v1/products/missing")).status_code == 404
    assert (await client.get("/api/v1/products/test-hidden")).status_code == 404


async def test_search_sort_stock_descendants(client):
    for q in ("Apple", "TEST-APPLE"):
        result = (await client.get("/api/v1/products", params={"q": q})).json()
        assert result["total"] == 1
    rows = (await client.get("/api/v1/products", params={"sort": "price_desc"})).json()
    assert [p["slug"] for p in rows["items"]] == ["test-banana", "test-apple"]
    rows = (await client.get("/api/v1/products", params={"in_stock": True})).json()
    assert rows["total"] == 1
    rows = (await client.get("/api/v1/products", params={"category": "test-produce"})).json()
    assert rows["total"] == 2
    assert (await client.get("/api/v1/products", params={"q": "%"})).json()["total"] == 0


async def test_pagination_and_ids(client):
    first = (await client.get("/api/v1/products", params={"page_size": 1})).json()
    second = (await client.get("/api/v1/products", params={"page_size": 1, "page": 2})).json()
    assert first["total"] == second["total"] == 2
    assert first["items"][0]["id"] != second["items"][0]["id"]
    row = first["items"][0]
    assert (await client.get("/api/v1/products", params={"ids": str(row["id"])})).json()[
        "total"
    ] == 1
    for params in ({"page": 0}, {"page_size": 49}, {"sort": "bad"}, {"ids": "bad"}):
        assert (await client.get("/api/v1/products", params=params)).status_code == 422


async def test_promotions_filter_and_pagination(client):
    assert (await client.get("/api/v1/products?on_sale=true")).json()["total"] == 0
    session = await anext(client._transport.app.dependency_overrides[get_session]())
    apple = await session.scalar(select(Product).where(Product.slug == "test-apple"))
    apple.old_price = Decimal("12.00")
    hidden = await session.scalar(select(Product).where(Product.slug == "test-hidden"))
    hidden.old_price = Decimal("20.00")
    await session.flush()
    result = (await client.get("/api/v1/products?on_sale=true&page_size=1")).json()
    assert result["total"] == 1 and result["items"][0]["slug"] == "test-apple"
    assert (await client.get("/api/v1/products?on_sale=true&page_size=1&page=2")).json()[
        "items"
    ] == []


async def test_price_range_filters(client):
    result = (
        await client.get("/api/v1/products", params={"min_price": "15", "max_price": "21"})
    ).json()
    assert result["total"] == 1
    assert result["items"][0]["slug"] == "test-banana"
    result = (await client.get("/api/v1/products", params={"max_price": "11"})).json()
    assert result["total"] == 1
    assert result["items"][0]["slug"] == "test-apple"
    assert (await client.get("/api/v1/products?min_price=-1")).status_code == 422
