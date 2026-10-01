"""Temporary browser test app: real test PostgreSQL, explicitly mocked ORS only.

Not included in the production app. Requires a dedicated *_test database.
Run via uvicorn tests.browser_fixture:app, then stop to remove owned fixture rows.
"""

import asyncio
import json
import os
from contextlib import asynccontextmanager
from decimal import Decimal
from uuid import uuid4

from httpx import AsyncClient, MockTransport, Response
from sqlalchemy import delete, select
from sqlalchemy.engine import make_url

from app.main import create_app
from app.models import Category, Order, OrderItem, Product
from app.services.delivery_service import DeliveryService, get_delivery_service
from tests.test_delivery import configured, provider_route

url = os.environ["TEST_DATABASE_URL"]
if not make_url(url).database.endswith("_test"):
    raise RuntimeError("Browser fixtures require a dedicated *_test database")
settings = configured(database_url=url)
app = create_app(settings)
original_lifespan = app.router.lifespan_context


@asynccontextmanager
async def fixture_lifespan(application):
    async with original_lifespan(application):
        token = f"browser-test-{uuid4()}"
        async with application.state.sessions.begin() as session:
            category = Category(name="Browser fixtures", slug=token)
            session.add(category)
            await session.flush()
            product = Product(
                category_id=category.id,
                name="Browser fixture apples",
                slug=token,
                sku=token,
                price=Decimal("10.50"),
                unit="pack",
                stock_quantity=10,
                is_active=True,
                image_url="/images/products/apple.svg",
            )
            session.add(product)
            await session.flush()
            product_id, category_id = product.id, category.id

        async def provider(request):
            await asyncio.sleep(0.3)
            coordinates = json.loads(request.content)["coordinates"]
            data = provider_route()
            data["features"][0]["geometry"]["coordinates"] = coordinates
            return Response(200, json=data)

        try:
            async with AsyncClient(transport=MockTransport(provider)) as client:
                service = DeliveryService(settings, client)
                application.dependency_overrides[get_delivery_service] = lambda: service
                yield
        finally:
            async with application.state.sessions.begin() as session:
                owned_orders = select(OrderItem.order_id).where(OrderItem.product_id == product_id)
                await session.execute(delete(Order).where(Order.id.in_(owned_orders)))
                await session.execute(delete(Product).where(Product.id == product_id))
                await session.execute(delete(Category).where(Category.id == category_id))


app.router.lifespan_context = fixture_lifespan
