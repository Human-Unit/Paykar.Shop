import os
from decimal import Decimal

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import Settings
from app.core.database import get_session
from app.main import create_app
from app.models import Category, Product, ProductConnection

pytestmark = pytest.mark.integration


@pytest_asyncio.fixture
async def catalog():
    url = os.getenv("TEST_DATABASE_URL")
    if not url:
        pytest.skip("BLOCKED: set TEST_DATABASE_URL to a migrated dedicated PostgreSQL database")
    engine = create_async_engine(url, poolclass=NullPool)
    async with engine.connect() as connection:
        transaction = await connection.begin()
        async with AsyncSession(bind=connection, expire_on_commit=False) as session:
            category = Category(name="Connection test", slug="connection-test")
            session.add(category)
            await session.flush()
            products = {}
            for slug, active, stock in [
                ("connection-source", True, 4),
                ("connection-second-source", True, 4),
                ("connection-first-target", True, 4),
                ("connection-second-target", True, 4),
                ("connection-inactive-target", False, 4),
                ("connection-inactive-edge-target", True, 4),
                ("connection-empty-target", True, 0),
            ]:
                product = Product(
                    category_id=category.id,
                    name=slug,
                    slug=slug,
                    sku=slug.upper(),
                    price=Decimal("2.50"),
                    unit="each",
                    stock_quantity=stock,
                    is_active=active,
                )
                session.add(product)
                products[slug] = product
            await session.flush()

            async def override():
                yield session

            app = create_app(Settings(_env_file=None))
            app.dependency_overrides[get_session] = override
            async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
            ) as client:
                yield client, session, products
        await transaction.rollback()
    await engine.dispose()


def edge(products, source, target, position=0, active=True):
    return ProductConnection(
        source_product_id=products[source].id,
        target_product_id=products[target].id,
        position=position,
        is_active=active,
    )


async def test_single_connections_are_curated_ordered_and_available(catalog):
    client, session, products = catalog
    session.add_all(
        [
            edge(products, "connection-source", "connection-second-target", position=2),
            edge(products, "connection-source", "connection-first-target", position=0),
            edge(products, "connection-source", "connection-inactive-target", position=1),
            edge(products, "connection-source", "connection-inactive-edge-target", active=False),
            edge(products, "connection-source", "connection-empty-target", position=3),
        ]
    )
    await session.flush()

    response = await client.get("/api/v1/products/connection-source/connections")

    assert response.status_code == 200
    assert [item["slug"] for item in response.json()["items"]] == [
        "connection-first-target",
        "connection-second-target",
    ]


async def test_existing_source_without_connections_returns_empty_list(catalog):
    client, _, _ = catalog

    response = await client.get("/api/v1/products/connection-second-source/connections")

    assert response.status_code == 200
    assert response.json() == {"items": []}


async def test_missing_source_returns_404(catalog):
    client, _, _ = catalog

    assert (await client.get("/api/v1/products/missing/connections")).status_code == 404


async def test_batch_preserves_source_and_connection_order(catalog):
    client, session, products = catalog
    session.add_all(
        [
            edge(products, "connection-source", "connection-second-target", position=1),
            edge(products, "connection-source", "connection-first-target", position=0),
            edge(products, "connection-second-source", "connection-second-target", position=0),
        ]
    )
    await session.flush()

    response = await client.post(
        "/api/v1/products/connections",
        json={"source_slugs": ["connection-second-source", "connection-source"]},
    )

    assert response.status_code == 200
    groups = response.json()["items"]
    assert [group["source_slug"] for group in groups] == [
        "connection-second-source",
        "connection-source",
    ]
    assert [item["slug"] for item in groups[1]["items"]] == [
        "connection-first-target",
        "connection-second-target",
    ]


async def test_duplicate_and_self_relationships_are_rejected(catalog):
    _, session, products = catalog
    session.add(edge(products, "connection-source", "connection-first-target"))
    await session.flush()

    with pytest.raises(IntegrityError):
        async with session.begin_nested():
            session.add(edge(products, "connection-source", "connection-first-target"))
            await session.flush()

    with pytest.raises(IntegrityError):
        async with session.begin_nested():
            session.add(edge(products, "connection-source", "connection-source"))
            await session.flush()
