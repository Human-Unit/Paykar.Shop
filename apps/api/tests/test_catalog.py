import os
from decimal import Decimal

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import event, select
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


@pytest_asyncio.fixture
async def rich_client(client):
    session = await anext(client._transport.app.dependency_overrides[get_session]())
    parent = await session.scalar(select(Category).where(Category.slug == "test-produce"))
    vegetable = Category(name="Test vegetables", slug="test-veg", parent_id=parent.id)
    dairy = Category(name="Test dairy", slug="test-dairy")
    session.add_all([vegetable, dairy])
    await session.flush()
    for slug, old_price in [("test-apple", "15"), ("test-banana", "25")]:
        row = await session.scalar(select(Product).where(Product.slug == slug))
        row.old_price = Decimal(old_price)
    for slug, price, old_price, category, unit in [
        ("test-carrot", "15", "30", vegetable, "kg"),
        ("test-milk", "12", None, dairy, "bottle"),
    ]:
        session.add(
            Product(
                category_id=category.id,
                name=slug,
                slug=slug,
                sku=slug.upper(),
                price=Decimal(price),
                old_price=Decimal(old_price) if old_price else None,
                unit=unit,
                stock_quantity=4,
                is_active=True,
            )
        )
    await session.flush()
    yield client


@pytest.mark.parametrize(
    ("params", "expected"),
    [
        ({"q": "TEST-APPLE"}, ["test-apple"]),
        ({"q": "test", "category": "test-fruit"}, ["test-apple", "test-banana"]),
        (
            {"category": "test-produce", "min_price": "11", "max_price": "20"},
            ["test-banana", "test-carrot"],
        ),
        ({"min_price": "20"}, ["test-banana"]),
        ({"max_price": "11"}, ["test-apple"]),
        ({"min_price": "11", "max_price": "16"}, ["test-carrot", "test-milk"]),
        ({"in_stock": "true"}, ["test-apple", "test-carrot", "test-milk"]),
        ({"on_sale": "true"}, ["test-apple", "test-banana", "test-carrot"]),
        ({"in_stock": "true", "on_sale": "true"}, ["test-apple", "test-carrot"]),
        ({"q": "Apple", "max_price": "11", "in_stock": "true"}, ["test-apple"]),
        (
            {
                "category": "test-produce",
                "min_price": "10",
                "max_price": "16",
                "in_stock": "true",
                "on_sale": "true",
            },
            ["test-apple", "test-carrot"],
        ),
        ({"unit": "pack"}, ["test-apple", "test-banana"]),
        ({"unit": "kg"}, ["test-carrot"]),
        ({"unit": "unknown"}, []),
        ({"min_discount": "20"}, ["test-apple", "test-banana", "test-carrot"]),
        ({"min_discount": "30"}, ["test-apple", "test-carrot"]),
        ({"min_discount": "50"}, ["test-carrot"]),
        ({"min_discount": "100"}, []),
        ({"min_discount": "0"}, ["test-apple", "test-banana", "test-carrot"]),
        (
            {"category": "test-produce", "subcategory": "test-fruit", "in_stock": "true"},
            ["test-apple"],
        ),
        ({"category": "test-dairy", "subcategory": "test-fruit"}, []),
        ({"subcategory": "missing"}, []),
        (
            {
                "q": "test",
                "category": "test-produce",
                "subcategory": "test-fruit",
                "min_price": "10",
                "max_price": "21",
                "min_discount": "20",
                "unit": "pack",
                "in_stock": "true",
                "on_sale": "true",
            },
            ["test-apple"],
        ),
        ({"q": "does-not-exist"}, []),
    ],
)
async def test_filter_intersections_and_counts(rich_client, params, expected):
    response = await rich_client.get("/api/v1/products", params=params)
    assert response.status_code == 200
    result = response.json()
    assert sorted(item["slug"] for item in result["items"]) == sorted(expected)
    assert result["total"] == len(expected)


@pytest.mark.parametrize("sort", ["name", "price_asc", "price_desc"])
async def test_sorting_pagination_after_filtering(rich_client, sort):
    params = {"category": "test-produce", "on_sale": "true", "sort": sort}
    full = (await rich_client.get("/api/v1/products", params=params)).json()
    values = [row["name"] if sort == "name" else Decimal(row["price"]) for row in full["items"]]
    assert values == sorted(values, reverse=sort == "price_desc")
    pages = []
    for page in range(1, 5):
        result = (
            await rich_client.get(
                "/api/v1/products", params={**params, "page_size": 1, "page": page}
            )
        ).json()
        assert result["total"] == 3
        assert result["page"] == page and result["page_size"] == 1
        pages.extend(result["items"])
        if page == 4:
            assert result["items"] == []
    assert [row["id"] for row in pages] == [row["id"] for row in full["items"]]


@pytest.mark.parametrize(
    "params",
    [
        {"min_price": "-1"},
        {"max_price": "-1"},
        {"min_price": "bad"},
        {"max_price": "NaN"},
        {"min_price": "Infinity"},
        {"min_price": "10000000000"},
        {"max_price": "12.123"},
        {"min_price": "20", "max_price": "10"},
        {"min_discount": "-1"},
        {"min_discount": "101"},
        {"min_discount": "NaN"},
        {"in_stock": "bad"},
        {"unit": "x" * 41},
        {"subcategory": "x" * 161},
    ],
)
async def test_invalid_filter_parameters(rich_client, params):
    assert (await rich_client.get("/api/v1/products", params=params)).status_code == 422


async def test_real_facets_are_independent_of_selected_price_and_pagination(rich_client):
    params = {"category": "test-produce", "include_facets": "true", "page_size": 1}
    result = (await rich_client.get("/api/v1/products", params=params)).json()
    facets = result["facets"]
    assert facets["units"] == ["kg", "pack"]
    # Whole-som inclusive presets may share a boundary; no product price is lost.
    for row in facets["price_presets"]:
        for bound in (row["min_price"], row["max_price"]):
            if bound is not None:
                assert Decimal(bound) == Decimal(bound).to_integral_value()
    filtered = (
        await rich_client.get("/api/v1/products", params={**params, "min_price": "19"})
    ).json()
    assert filtered["total"] == 1 and filtered["facets"] == facets
    for price in [Decimal("10.50"), Decimal("15"), Decimal("20")]:
        matching = [
            row
            for row in facets["price_presets"]
            if (row["min_price"] is None or price >= Decimal(row["min_price"]))
            and (row["max_price"] is None or price <= Decimal(row["max_price"]))
        ]
        assert matching
    empty = (
        await rich_client.get("/api/v1/products", params={**params, "q": "nonexistent"})
    ).json()
    assert empty["total"] == 0
    assert empty["facets"] == {"units": [], "price_presets": []}


async def test_zero_old_price_and_null_old_price_cannot_be_discounted(rich_client):
    session = await anext(rich_client._transport.app.dependency_overrides[get_session]())
    apple = await session.scalar(select(Product).where(Product.slug == "test-apple"))
    apple.old_price = Decimal("0")
    await session.flush()
    result = (await rich_client.get("/api/v1/products?min_discount=20")).json()
    assert result["total"] == 2
    assert {row["slug"] for row in result["items"]} == {"test-banana", "test-carrot"}


@pytest.mark.parametrize("page_size", [1, 48])
async def test_facets_query_count_is_bounded_without_n_plus_one(rich_client, page_size):
    session = await anext(rich_client._transport.app.dependency_overrides[get_session]())
    statements = []

    def record(connection, cursor, statement, parameters, context, executemany):
        statements.append(statement)

    connection = session.bind.sync_connection
    event.listen(connection, "before_cursor_execute", record)
    try:
        response = await rich_client.get(
            "/api/v1/products", params={"include_facets": "true", "page_size": page_size}
        )
        assert response.status_code == 200 and response.json()["total"] == 4
        assert len(statements) == 3  # count, page, one aggregate for all facets
    finally:
        event.remove(connection, "before_cursor_execute", record)


async def test_price_filters_and_composition(client):
    result = (await client.get("/api/v1/products", params={"min_price": "15.00"})).json()
    assert result["total"] == 1
    assert result["items"][0]["slug"] == "test-banana"

    result = (await client.get("/api/v1/products", params={"max_price": "15.00"})).json()
    assert result["total"] == 1
    assert result["items"][0]["slug"] == "test-apple"

    result = (
        await client.get(
            "/api/v1/products",
            params={"min_price": "10.50", "max_price": "10.50"},
        )
    ).json()
    assert result["total"] == 1
    assert result["items"][0]["slug"] == "test-apple"

    session = await anext(client._transport.app.dependency_overrides[get_session]())
    apple = await session.scalar(select(Product).where(Product.slug == "test-apple"))
    apple.old_price = Decimal("12.00")
    await session.flush()

    result = (
        await client.get(
            "/api/v1/products",
            params={
                "on_sale": True,
                "in_stock": True,
                "min_price": "10.00",
                "max_price": "11.00",
            },
        )
    ).json()
    assert result["total"] == 1
    assert result["items"][0]["slug"] == "test-apple"

    assert (
        await client.get(
            "/api/v1/products",
            params={"min_price": "21.00", "max_price": "20.00"},
        )
    ).status_code == 422
    assert (await client.get("/api/v1/products", params={"min_price": "-1"})).status_code == 422
