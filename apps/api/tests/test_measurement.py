from decimal import Decimal
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.models import Product
from app.schemas.measurement import Measurement
from app.schemas.order import CartItem, OrderItemOut
from app.services.measurement import measure, stock_limit
from tests import test_orders
from tests.test_orders import body

shop = test_orders.shop


def product(mode="DUAL", price="14.90", **changes):
    return SimpleNamespace(
        **{
            "measurement_mode": mode,
            "price_unit": "PIECE" if mode == "PIECE" else "KG",
            "average_piece_weight_g": 180 if mode == "DUAL" else None,
            "quantity_step": 1 if mode == "PIECE" else 50,
            "minimum_quantity": 1 if mode == "PIECE" else 50,
            "stock_quantity": Decimal("32.000"),
            "is_active": True,
            "price": Decimal(price),
            **changes,
        }
    )


@pytest.mark.parametrize(
    "mode,item_data,expected",
    [
        ("PIECE", {"piece_count": 3, "purchase_mode": "PIECE"}, "44.70"),
        ("WEIGHT", {"requested_weight_g": 1250, "purchase_mode": "WEIGHT"}, "18.63"),
        ("DUAL", {"requested_weight_g": 1250, "purchase_mode": "WEIGHT"}, "18.63"),
        ("DUAL", {"piece_count": 6, "purchase_mode": "PIECE"}, "16.09"),
        ("DUAL", {"quantity": 2}, "29.80"),
        ("PIECE", {"quantity": 2}, "29.80"),
    ],
)
def test_canonical_pricing(mode, item_data, expected):
    result = measure(product(mode), CartItem(product_id=1, **item_data))
    assert result.total_price == Decimal(expected)
    if mode == "DUAL" and item_data.get("purchase_mode") == "PIECE":
        assert result.estimated_weight_g == 1080
        assert result.quantity == Decimal("1.080")
        assert result.is_estimated


@pytest.mark.parametrize(
    "configuration",
    [
        {"measurement_mode": "DUAL", "price_unit": "KG"},
        {"measurement_mode": "DUAL", "price_unit": "KG", "average_piece_weight_g": 0},
        {"measurement_mode": "WEIGHT", "price_unit": "PIECE"},
        {"average_piece_weight_g": 180},
        {
            "measurement_mode": "WEIGHT",
            "price_unit": "KG",
            "quantity_step": 100,
            "minimum_quantity": 50,
        },
    ],
)
def test_invalid_measurement(configuration):
    with pytest.raises(ValidationError):
        Measurement(**configuration)


@pytest.mark.parametrize(
    "item_data",
    [
        {"purchase_mode": "PIECE", "piece_count": 0},
        {"purchase_mode": "PIECE", "piece_count": 1.5},
        {"purchase_mode": "WEIGHT", "requested_weight_g": -10},
        {"purchase_mode": "WEIGHT", "requested_weight_g": 100, "piece_count": 2},
        {"quantity": 2, "estimated_weight_g": 10},
        {"purchase_mode": "PIECE", "piece_count": 2, "unit_price": "0.01"},
    ],
)
def test_invalid_or_spoofed_requests(item_data):
    with pytest.raises(ValidationError):
        CartItem(product_id=1, **item_data)


def test_rounding_limits_and_step():
    assert measure(
        product("WEIGHT", price="0.10"),
        CartItem(product_id=1, purchase_mode="WEIGHT", requested_weight_g=50),
    ).total_price == Decimal("0.01")
    p = product(stock_quantity=Decimal("0.359"))
    assert stock_limit(p, "PIECE") == 1
    assert stock_limit(p, "WEIGHT") == 350
    with pytest.raises(HTTPException):
        measure(p, CartItem(product_id=1, purchase_mode="WEIGHT", requested_weight_g=51))
    with pytest.raises(HTTPException):
        measure(
            product("PIECE"), CartItem(product_id=1, purchase_mode="WEIGHT", requested_weight_g=100)
        )
    with pytest.raises(HTTPException):
        measure(product("WEIGHT"), CartItem(product_id=1, purchase_mode="PIECE", piece_count=1))


@pytest.mark.asyncio
async def test_order_measurement_snapshot_and_stock(shop):
    client, sessions, ids, *_ = shop
    async with sessions.begin() as session:
        p = await session.get(Product, ids[0])
        p.measurement_mode, p.price_unit = "DUAL", "KG"
        p.average_piece_weight_g = 180
        p.quantity_step = p.minimum_quantity = 100
        p.price = Decimal("14.90")
    item_data = body(
        shop,
        items=[{"product_id": ids[0], "purchase_mode": "PIECE", "piece_count": 6}],
        expected_total="36.09",
    )
    result = await client.post("/api/v1/orders", json=item_data)
    assert result.status_code == 201, result.text
    order = result.json()
    item = order["items"][0]
    assert item["estimated_weight_g"] == 1080
    assert item["average_piece_weight_g_snapshot"] == 180
    assert item["requested_piece_count"] == 6
    assert item["requested_weight_g"] is None
    assert item["actual_weight_g"] is None
    assert item["price_unit_snapshot"] == "KG"
    assert order["is_estimated"]
    assert order["estimated_order_total"] == order["final_order_total"] == "36.09"
    async with sessions.begin() as session:
        p = await session.get(Product, ids[0])
        assert p.stock_quantity == Decimal("3.920")
        p.average_piece_weight_g = 200
        p.price = Decimal("99")
    assert (await client.get(f"/api/v1/orders/{order['id']}")).json() == order


@pytest.mark.asyncio
async def test_weight_stock_and_current_price_cannot_be_spoofed(shop):
    client, sessions, ids, *_ = shop
    async with sessions.begin() as session:
        p = await session.get(Product, ids[0])
        p.measurement_mode, p.price_unit = "WEIGHT", "KG"
        p.quantity_step = p.minimum_quantity = 50
        p.stock_quantity = Decimal("1.250")
        p.price = Decimal("45")
    item = {"product_id": ids[0], "purchase_mode": "WEIGHT", "requested_weight_g": 1250}
    response = await client.post(
        "/api/v1/orders", json=body(shop, items=[item], expected_total="1.00")
    )
    assert response.status_code == 409
    assert response.json()["detail"]["total"] == "76.25"
    response = await client.post(
        "/api/v1/orders",
        json=body(shop, items=[{**item, "requested_weight_g": 1300}], expected_total="78.50"),
    )
    assert response.status_code == 409
    assert response.json()["detail"]["code"] == "insufficient_stock"
    response = await client.post(
        "/api/v1/orders", json=body(shop, items=[item], expected_total="76.25")
    )
    assert response.status_code == 201, response.text
    assert not response.json()["is_estimated"]
    async with sessions() as session:
        assert (await session.get(Product, ids[0])).stock_quantity == 0


def test_actual_weight_ready_but_not_required():
    item = OrderItemOut(
        product_id=1,
        product_name="Banana",
        quantity=Decimal("1.080"),
        unit_price=Decimal("14.90"),
        total_price=Decimal("16.09"),
        price_unit_snapshot="KG",
        actual_weight_g=1130,
    )
    assert item.estimated_line_total == "16.09"
    assert item.final_line_total == "16.84"
