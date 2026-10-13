import os
from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import delete, select
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import Settings
from app.core.database import get_session
from app.main import create_app
from app.models import (
    AdminAudit,
    AdminSession,
    AdminUser,
    Category,
    DesignConfig,
    LoginLimit,
    Order,
    Product,
)
from app.schemas.design import PaykarDesign
from app.services.admin_auth import digest, hasher

PASSWORD = "integration-only-password-not-a-bootstrap-default"
ORIGIN = {"Origin": "http://localhost:3000"}


@pytest_asyncio.fixture
async def administration():
    url = os.environ["TEST_DATABASE_URL"]
    assert make_url(url).database.endswith("_test")
    engine = create_async_engine(url, poolclass=NullPool)
    sessions = async_sessionmaker(engine, expire_on_commit=False)
    suffix = uuid4().hex
    async with sessions.begin() as session:
        users = [
            AdminUser(
                email=f"{role.lower()}-{suffix}@example.test",
                display_name=role,
                password_hash=hasher.hash(PASSWORD),
                role=role,
            )
            for role in ("MASTER", "ADMIN")
        ]
        session.add_all(users)
        category = Category(name="Administration test", slug=f"admin-{suffix}")
        session.add(category)
        await session.flush()
        product = Product(
            category_id=category.id,
            name="Admin product",
            slug=f"admin-product-{suffix}",
            sku=suffix,
            price=10,
            stock_quantity=3,
            unit="pack",
        )
        session.add(product)
        await session.flush()
        product_id, category_id = product.id, category.id
    app = create_app(Settings(admin_cookie_secure=False))

    async def override():
        async with sessions() as session:
            yield session

    app.dependency_overrides[get_session] = override
    async with AsyncClient(
        transport=ASGITransport(app), base_url="http://localhost:3000"
    ) as client:
        yield client, sessions, users, product_id, category_id
    async with sessions.begin() as session:
        all_ids = list(
            await session.scalars(select(AdminUser.id).where(AdminUser.email.contains(suffix)))
        )
        await session.execute(delete(DesignConfig).where(DesignConfig.created_by.in_(all_ids)))
        await session.execute(delete(AdminAudit).where(AdminAudit.actor_id.in_(all_ids)))
        await session.execute(delete(AdminUser).where(AdminUser.id.in_(all_ids)))
        await session.execute(delete(LoginLimit))
        await session.execute(delete(Product).where(Product.id == product_id))
        await session.execute(delete(Category).where(Category.id == category_id))
    await engine.dispose()


async def sign_in(fixture, role="MASTER"):
    client, _, users, *_ = fixture
    account = next(u for u in users if u.role == role)
    response = await client.post(
        "/api/v1/admin/auth/login",
        headers=ORIGIN,
        json={"email": account.email, "password": PASSWORD},
    )
    assert response.status_code == 200
    assert "password_hash" not in response.text
    return {**ORIGIN, "X-Admin-CSRF": response.json()["csrf"]}


@pytest.mark.asyncio
async def test_authentication_session_logout(administration):
    client = administration[0]
    assert (await client.get("/api/v1/admin/overview")).status_code == 401
    absent = await client.post(
        "/api/v1/admin/auth/login",
        headers=ORIGIN,
        json={"email": "absent@example.test", "password": "wrong"},
    )
    invalid = await client.post(
        "/api/v1/admin/auth/login",
        headers=ORIGIN,
        json={"email": administration[2][0].email, "password": "wrong"},
    )
    assert absent.status_code == invalid.status_code == 401
    assert absent.json() == invalid.json()
    headers = await sign_in(administration)
    assert (await client.get("/api/v1/admin/auth/me")).json()["user"]["role"] == "MASTER"
    cookie = client.cookies.get("paykar_admin")
    async with administration[1]() as session:
        assert await session.get(AdminSession, digest(cookie))
        assert await session.get(AdminSession, cookie) is None
    assert (
        await client.post("/api/v1/admin/auth/logout", headers=headers, json={})
    ).status_code == 200
    assert (await client.get("/api/v1/admin/overview")).status_code == 401


@pytest.mark.asyncio
async def test_expiry_and_csrf(administration):
    client, sessions, *_ = administration
    headers = await sign_in(administration)
    assert (
        await client.post("/api/v1/admin/auth/logout", headers=ORIGIN, json={})
    ).status_code == 403
    assert (
        await client.post(
            "/api/v1/admin/auth/logout", headers={**headers, "Origin": "https://evil.test"}, json={}
        )
    ).status_code == 403
    async with sessions.begin() as session:
        record = await session.get(AdminSession, digest(client.cookies.get("paykar_admin")))
        record.expires_at = datetime.now(UTC) - timedelta(seconds=1)
    assert (await client.get("/api/v1/admin/overview")).status_code == 401


@pytest.mark.asyncio
async def test_admin_permissions_and_product_update(administration):
    client, _, _, identifier, category = administration
    headers = await sign_in(administration, "ADMIN")
    assert (await client.get("/api/v1/admin/overview")).status_code == 200
    for path in ("master/design", "master/administrators", "master/audit"):
        assert (await client.get(f"/api/v1/admin/{path}")).status_code == 403
    assert (
        await client.post(
            "/api/v1/admin/master/design", headers=headers, json=PaykarDesign().model_dump()
        )
    ).status_code == 403
    current = (await client.get("/api/v1/admin/products?q=Admin+product")).json()["items"][0]
    body = {
        key: current[key]
        for key in (
            "name",
            "slug",
            "sku",
            "description",
            "category_id",
            "price",
            "old_price",
            "unit",
            "image_url",
            "stock_quantity",
            "is_active",
        )
    }
    body.update(price="12.00", expected_stock="3.000")
    assert (
        await client.post(f"/api/v1/admin/products/{identifier}", headers=headers, json=body)
    ).status_code == 200
    assert (await client.get("/api/v1/admin/products?q=Admin+product")).json()["items"][0][
        "price"
    ] == 12
    assert (
        await client.post(
            "/api/v1/admin/categories",
            headers=headers,
            json={"name": "Cycle", "slug": "cycle", "parent_id": 999999},
        )
    ).status_code == 404
    assert (
        await client.post(
            f"/api/v1/admin/categories/{category}",
            headers=headers,
            json={"name": "Cycle", "slug": "cycle", "parent_id": category},
        )
    ).status_code == 422


@pytest.mark.asyncio
async def test_stock_conflict_and_store_validation(administration):
    client, _, _, product_id, _ = administration
    headers = await sign_in(administration)
    path = f"/api/v1/admin/inventory/{product_id}"
    assert (
        await client.post(
            path, headers=headers, json={"expected_stock": "3", "stock_quantity": "5"}
        )
    ).status_code == 200
    assert (
        await client.post(
            path, headers=headers, json={"expected_stock": "3", "stock_quantity": "6"}
        )
    ).status_code == 409
    stores = (await client.get("/api/v1/admin/stores")).json()
    original = stores[0]
    body = {k: v for k, v in original.items() if k != "id"}
    assert (
        await client.post(
            f"/api/v1/admin/stores/{original['id']}", headers=headers, json={**body, "latitude": 91}
        )
    ).status_code == 422
    assert (
        await client.post(f"/api/v1/admin/stores/{original['id']}", headers=headers, json=body)
    ).status_code == 200
    public = (await client.get("/api/v1/stores")).json()
    assert public[0]["latitude"] == original["latitude"]


@pytest.mark.asyncio
async def test_design_lifecycle_and_public_isolation(administration):
    client = administration[0]
    headers = await sign_in(administration)
    public = (await client.get("/api/v1/design/public")).json()
    config = PaykarDesign().model_dump()
    config["colors"]["brand"] = "#118833"
    draft = await client.post("/api/v1/admin/master/design", headers=headers, json=config)
    assert draft.status_code == 201
    draft = draft.json()
    assert (await client.get("/api/v1/design/public")).json() == public
    assert (
        await client.post(
            f"/api/v1/admin/master/design/{draft['id']}/publish", headers=headers, json={}
        )
    ).status_code == 200
    published = (await client.get("/api/v1/design/public")).json()
    assert set(published) == {"version", "config"}
    assert published["config"]["colors"]["brand"] == "#118833"
    assert (
        await client.post(
            f"/api/v1/admin/master/design/{draft['id']}/publish", headers=headers, json={}
        )
    ).status_code == 409
    defaults = (
        await client.post(
            "/api/v1/admin/master/design", headers=headers, json=PaykarDesign().model_dump()
        )
    ).json()
    assert (
        await client.post(
            f"/api/v1/admin/master/design/{defaults['id']}/publish", headers=headers, json={}
        )
    ).status_code == 200
    restored = (
        await client.post(
            f"/api/v1/admin/master/design/{draft['id']}/restore", headers=headers, json={}
        )
    ).json()
    assert restored["version"] > defaults["version"]
    assert restored["status"] == "DRAFT"
    assert restored["config"] == config
    assert (await client.get("/api/v1/design/public")).json()[
        "config"
    ] == PaykarDesign().model_dump()
    history = (await client.get("/api/v1/admin/master/design")).json()
    assert len([v for v in history if v["status"] == "PUBLISHED"]) == 1
    assert next(v for v in history if v["id"] == draft["id"])["status"] == "ARCHIVED"


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "path,value",
    [
        ("layout.content_width", 50),
        ("typography.heading_scale", 8),
        ("effects.glass_opacity", -4),
        ("colors.brand", "red;display:none"),
        ("motion.hover_lift", 100),
    ],
)
async def test_invalid_design_rejected(administration, path, value):
    client = administration[0]
    headers = await sign_in(administration)
    config = PaykarDesign().model_dump()
    group, key = path.split(".")
    config[group][key] = value
    assert (
        await client.post("/api/v1/admin/master/design", headers=headers, json=config)
    ).status_code == 422


@pytest.mark.asyncio
async def test_admin_creation_and_last_master(administration):
    client, _, users, *_ = administration
    headers = await sign_in(administration)
    master = users[0]
    assert (
        await client.post(
            f"/api/v1/admin/master/administrators/{master.id}",
            headers=headers,
            json={"display_name": "Master", "role": "ADMIN", "is_active": True},
        )
    ).status_code == 409
    created = await client.post(
        "/api/v1/admin/master/administrators",
        headers=headers,
        json={
            "email": f"second-{master.email}",
            "password": PASSWORD,
            "display_name": "Second",
            "role": "MASTER",
        },
    )
    assert created.status_code == 201
    assert "password" not in created.text
    response = await client.post(
        f"/api/v1/admin/master/administrators/{created.json()['id']}",
        headers=headers,
        json={"display_name": "Second", "role": "ADMIN", "is_active": False},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_login_origin_cookie_and_throttle(administration):
    client = administration[0]
    login = {"email": administration[2][0].email, "password": PASSWORD}
    assert (await client.post("/api/v1/admin/auth/login", json=login)).status_code == 403
    response = await client.post("/api/v1/admin/auth/login", headers=ORIGIN, json=login)
    cookie = response.headers["set-cookie"]
    assert "HttpOnly" in cookie and "SameSite=strict" in cookie and "Max-Age=28800" in cookie
    for _ in range(8):
        assert (
            await client.post(
                "/api/v1/admin/auth/login", headers=ORIGIN, json={**login, "password": "wrong"}
            )
        ).status_code == 401
    assert (
        await client.post("/api/v1/admin/auth/login", headers=ORIGIN, json=login)
    ).status_code == 429


def test_design_rejects_unknown_fields_and_baseline():
    from pydantic import ValidationError

    with pytest.raises(ValidationError):
        PaykarDesign.model_validate({"arbitrary_css": "body{display:none}"})
    assert PaykarDesign().layout.content_width == 1320


@pytest.mark.asyncio
async def test_category_product_creation_and_asset_validation(administration):
    client, sessions, *_ = administration
    headers = await sign_in(administration)
    token = uuid4().hex
    category = await client.post(
        "/api/v1/admin/categories",
        headers=headers,
        json={"name": "New category", "slug": f"new-{token}"},
    )
    assert category.status_code == 201
    category_id = category.json()["id"]
    try:
        body = {
            "name": "New product",
            "slug": f"new-{token}",
            "sku": token,
            "category_id": category_id,
            "price": "10",
            "old_price": "20",
            "stock_quantity": "2",
            "unit": "pack",
            "image_url": "/images/missing.webp",
        }
        assert (
            await client.post("/api/v1/admin/products", headers=headers, json=body)
        ).status_code == 422
        assets = (await client.get("/api/v1/admin/product-assets")).json()
        assert len(assets) == 40
        body["image_url"] = assets[0]
        product = await client.post("/api/v1/admin/products", headers=headers, json=body)
        assert product.status_code == 201
        assert (
            await client.get(
                f"/api/v1/admin/products?category_id={category_id}&sale=true&stock=available"
            )
        ).json()["total"] == 1
        body.update(is_active=False, expected_stock="2")
        assert (
            await client.post(
                f"/api/v1/admin/products/{product.json()['id']}", headers=headers, json=body
            )
        ).status_code == 200
        # Deliberately no destructive category endpoint while products depend on it.
        assert (
            await client.delete(f"/api/v1/admin/categories/{category_id}", headers=headers)
        ).status_code == 405
    finally:
        async with sessions.begin() as session:
            await session.execute(delete(Product).where(Product.category_id == category_id))
            await session.execute(delete(Category).where(Category.id == category_id))


@pytest.mark.asyncio
async def test_inline_gate_and_master_scope_lifecycle(administration):
    client = administration[0]
    assert (await client.get("/api/v1/admin/auth/design-access")).json() == {"enabled": False}
    headers = await sign_in(administration, "ADMIN")
    assert (await client.get("/api/v1/admin/auth/design-access")).json() == {"enabled": False}
    assert (await client.get("/api/v1/admin/master/design")).status_code == 403
    assert (
        await client.post("/api/v1/admin/master/design", headers=headers, json={})
    ).status_code == 403
    headers = await sign_in(administration)
    gate = await client.get("/api/v1/admin/auth/design-access")
    assert gate.headers["cache-control"] == "no-store"
    assert gate.json()["identity"]["user"]["role"] == "MASTER"
    before = (await client.get("/api/v1/design/public")).json()
    config = PaykarDesign().model_dump()
    config["pages"] = {"home": {"radius.panel": 30}}
    config["sections"] = {"home.hero": {"colors.brand": "#224433"}}
    saved = await client.post("/api/v1/admin/master/design", headers=headers, json=config)
    assert saved.status_code == 201
    draft = saved.json()
    assert (await client.get("/api/v1/design/public")).json() == before
    assert (
        await client.post(
            f"/api/v1/admin/master/design/{draft['id']}/publish", headers=headers, json={}
        )
    ).status_code == 200
    public = (await client.get("/api/v1/design/public")).json()
    assert set(public) == {"config", "version"}
    assert public["config"]["sections"] == config["sections"]
    assert public["config"]["pages"] == config["pages"]
    assert public["config"]["colors"] == config["colors"]
    restored = (
        await client.post(
            f"/api/v1/admin/master/design/{draft['id']}/restore", headers=headers, json={}
        )
    ).json()
    assert restored["id"] != draft["id"]
    assert restored["version"] > draft["version"]
    assert restored["status"] == "DRAFT"
    assert (await client.get("/api/v1/design/public")).json() == public


@pytest.mark.asyncio
async def test_bounded_admin_sort_and_detail(administration):
    client, _, _, product_id, _ = administration
    await sign_in(administration, "ADMIN")
    assert (await client.get(f"/api/v1/admin/products/{product_id}")).status_code == 200
    assert (await client.get("/api/v1/admin/products?sort=-price&q=Admin")).status_code == 200
    assert (await client.get("/api/v1/admin/products?sort=arbitrary")).status_code == 422
    assert (
        await client.get("/api/v1/admin/orders?status=completed&sort=-total")
    ).status_code == 200
    assert (await client.get("/api/v1/admin/orders?status=made-up")).status_code == 422


@pytest.mark.asyncio
@pytest.mark.parametrize("resource", ["categories", "stores", "master/administrators"])
async def test_admin_small_lists_preserve_array_and_support_paging(administration, resource):
    client = administration[0]
    await sign_in(administration)
    legacy = await client.get(f"/api/v1/admin/{resource}")
    assert legacy.status_code == 200 and isinstance(legacy.json(), list)
    paged = await client.get(f"/api/v1/admin/{resource}?page=1&sort=name")
    assert paged.status_code == 200
    value = paged.json()
    assert value["total"] == len(legacy.json())
    assert value["page_size"] == 25 and value["page"] == 1
    assert len(value["items"]) == min(25, value["total"])
    assert all("password_hash" not in item for item in value["items"])
    empty = await client.get(f"/api/v1/admin/{resource}?page=1&q=owned-nonexistent-qa-record")
    assert empty.json()["total"] == 0 and empty.json()["items"] == []
    assert (await client.get(f"/api/v1/admin/{resource}?sort=arbitrary")).status_code == 422


@pytest.mark.asyncio
async def test_marketplace_problem_filters_preserve_grocery_units(administration):
    client, sessions, _, product_id, _ = administration
    await sign_in(administration, "ADMIN")
    async with sessions.begin() as session:
        product = await session.get(Product, product_id)
        product.measurement_mode = "DUAL"
        product.price_unit = "KG"
        product.average_piece_weight_g = 180
        product.quantity_step = 100
        product.minimum_quantity = 100
        product.stock_quantity = "0.500"
        sku = product.sku
    query = f"/api/v1/admin/products?q={sku}"
    value = (await client.get(f"{query}&stock=low&measurement=DUAL&view=problems")).json()
    assert value["total"] == 1
    assert value["items"][0]["low_stock"] is True
    assert value["items"][0]["invalid_measurement"] is False
    assert value["items"][0]["missing_image"] is True
    assert (await client.get(f"{query}&measurement=PIECE")).json()["total"] == 0
    assert (await client.get(f"{query}&stock=empty")).json()["total"] == 0
    async with sessions.begin() as session:
        product = await session.get(Product, product_id)
        product.minimum_quantity = 150  # DB permits this; the API schema rejects it.
    invalid = (await client.get(f"{query}&view=problems")).json()["items"][0]
    assert invalid["invalid_measurement"] is True
    for suffix in ["measurement=UNKNOWN", "view=unknown", "stock=reserved"]:
        assert (await client.get(f"{query}&{suffix}")).status_code == 422


@pytest.mark.asyncio
async def test_marketplace_overview_today_and_status_counts_are_real(administration):
    client, sessions, *_ = administration
    await sign_in(administration)
    before = (await client.get("/api/v1/admin/overview")).json()
    identifiers = [uuid4(), uuid4()]
    try:
        async with sessions.begin() as session:
            for identifier, status in zip(identifiers, ["pending", "cancelled"], strict=True):
                session.add(
                    Order(
                        id=identifier,
                        customer_name="Owned admin test",
                        phone="+992900000000",
                        address="Owned test address",
                        subtotal=10,
                        delivery_price=20,
                        total=30,
                        status=status,
                        payment_method="cash",
                        payment_status="due_on_delivery",
                        created_at=datetime.now(UTC),
                    )
                )
        value = (await client.get("/api/v1/admin/overview")).json()
        assert value["today"]["orders"] == before["today"]["orders"] + 1
        assert float(value["today"]["order_value"]) == float(before["today"]["order_value"]) + 30
        assert (
            value["order_status_counts"]["pending"]
            == before["order_status_counts"].get("pending", 0) + 1
        )
        assert value["attention"]["low_stock"] >= 1
        assert len(value["latest_orders"]) <= 5
        listed = (
            await client.get(f"/api/v1/admin/orders?q={identifiers[0]}&status=pending")
        ).json()
        assert listed["total"] == 1 and listed["status_counts"]["pending"] == 1
        assert listed["items"][0]["customer_name"] == "Owned admin test"
        assert listed["items"][0]["phone"] == "+992900000000"
        assert (await client.get("/api/v1/admin/orders?status=picking")).status_code == 422
    finally:
        async with sessions.begin() as session:
            await session.execute(delete(Order).where(Order.id.in_(identifiers)))
