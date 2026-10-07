import json
from pathlib import Path

import pytest

from app.services.shopping_service import load_curated, validate_curated
from tests.test_orders import body
from tests.test_orders import shop as order_shop

shop = order_shop


def test_curated_references_real_seed_products_and_is_repeatable():
    directory = (
        Path("/seed") if Path("/seed").exists() else Path(__file__).resolve().parents[3] / "db/seed"
    )
    definitions = load_curated(directory / "shopping_templates.json")
    products = json.loads((directory / "products.json").read_text("utf-8"))["products"]
    validate_curated(definitions, {row["slug"] for row in products})
    assert len(definitions) == 5
    assert load_curated(directory / "shopping_templates.json") == definitions
    with pytest.raises(ValueError, match="unknown product slugs"):
        validate_curated(definitions, set())


@pytest.mark.integration
async def test_repeat_preview_current_prices_stock_missing_and_immutable_history(shop):
    client, sessions, ids, _, _ = shop
    created = await client.post("/api/v1/orders", json=body(shop))
    assert created.status_code == 201
    order = created.json()
    from app.models import Product

    async with sessions.begin() as session:
        product = await session.get(Product, ids[0])
        product.price = 99
    preview = await client.post(
        "/api/v1/shopping/preview",
        json={
            "items": [
                {"product_id": ids[0], "quantity": 5},
                {"product_id": ids[2], "quantity": 1},
                {"product_id": 9223372036854775807, "quantity": 1},
            ]
        },
    )
    assert preview.status_code == 200, preview.text
    rows = preview.json()["items"]
    assert rows[0]["product"]["price"] == "99.00"
    assert rows[0]["requested_quantity"] == 5 and rows[0]["available_quantity"] == 3
    assert rows[1]["availability"] == "unavailable"
    assert rows[2]["availability"] == "missing"
    assert (await client.get(f"/api/v1/orders/{order['id']}")).json() == order
    async with sessions.begin() as session:
        product = await session.get(Product, ids[0])
        product.stock_quantity = 0
    empty = await client.post(
        "/api/v1/shopping/preview", json={"items": [{"product_id": ids[0], "quantity": 1}]}
    )
    assert empty.json()["items"][0]["availability"] == "unavailable"


@pytest.mark.integration
@pytest.mark.parametrize(
    "items",
    [
        [],
        [{"product_id": 1, "quantity": 0}],
        [{"product_id": 1, "quantity": 100}],
        [{"product_id": 1, "quantity": 1.5}],
        [{"product_id": 1, "quantity": 1}, {"product_id": 1, "quantity": 2}],
    ],
)
async def test_preview_rejects_invalid_quantities_and_duplicate_ids(shop, items):
    response = await shop[0].post("/api/v1/shopping/preview", json={"items": items})
    assert response.status_code == 422


@pytest.mark.integration
async def test_curated_listing_and_detail(shop):
    client = shop[0]
    response = await client.get("/api/v1/shopping/templates")
    assert response.status_code == 200
    rows = response.json()
    assert {row["id"] for row in rows} == {"family", "breakfast", "fresh", "guests", "weekly"}
    detail = await client.get("/api/v1/shopping/templates/family")
    assert detail.json() == next(row for row in rows if row["id"] == "family")
    assert (await client.get("/api/v1/shopping/templates/unknown")).status_code == 404
