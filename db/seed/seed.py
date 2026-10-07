"""Run locally from apps/api or inside Compose: python /seed/seed.py."""

import asyncio
import json
import sys
from decimal import Decimal
from pathlib import Path

# Compose uses /app; local checkout uses apps/api. Neither depends on caller cwd.
api_path = (
    Path("/app") if Path("/app/app").exists() else Path(__file__).resolve().parents[2] / "apps/api"
)
sys.path.insert(0, str(api_path))

from sqlalchemy import func, select  # noqa: E402
from sqlalchemy.dialects.postgresql import insert  # noqa: E402
from sqlalchemy.ext.asyncio import async_sessionmaker  # noqa: E402

from app.core.config import Settings  # noqa: E402
from app.core.database import make_engine  # noqa: E402
from app.models import Category, Product, ProductConnection  # noqa: E402


async def seed():
    seed_dir = Path(__file__).parent
    data = json.loads(seed_dir.joinpath("products.json").read_text(encoding="utf-8"))
    connections = json.loads(seed_dir.joinpath("connections.json").read_text(encoding="utf-8"))
    engine = make_engine(Settings())
    try:
        async with async_sessionmaker(engine).begin() as session:
            ids = {}
            for category in data["categories"]:
                stmt = (
                    insert(Category)
                    .values(
                        name=category["name"],
                        slug=category["slug"],
                        parent_id=ids.get(category.get("parent")),
                    )
                    .on_conflict_do_nothing(index_elements=["slug"])
                )
                await session.execute(stmt)
                ids[category["slug"]] = await session.scalar(
                    select(Category.id).where(Category.slug == category["slug"])
                )
            for item in data["products"]:
                values = {k: v for k, v in item.items() if k != "category"}
                for field in ("price", "old_price", "stock_quantity"):
                    if values.get(field) is not None:
                        values[field] = Decimal(str(values[field]))
                values["category_id"] = ids[item["category"]]
                # Never reset stock or overwrite future order-related catalog edits.
                await session.execute(
                    insert(Product).values(**values).on_conflict_do_nothing(index_elements=["sku"])
                )

            product_ids = dict((await session.execute(select(Product.slug, Product.id))).all())
            for connection in connections:
                source_id = product_ids.get(connection["source"])
                target_id = product_ids.get(connection["target"])
                if source_id is None or target_id is None:
                    raise RuntimeError(
                        "Unknown seeded product connection: "
                        f"{connection['source']} -> {connection['target']}"
                    )
                await session.execute(
                    insert(ProductConnection)
                    .values(
                        source_product_id=source_id,
                        target_product_id=target_id,
                        relation_type=connection.get("relation_type", "complementary"),
                        position=connection.get("position", 0),
                        is_active=True,
                    )
                    .on_conflict_do_nothing(
                        index_elements=[
                            "source_product_id",
                            "target_product_id",
                            "relation_type",
                        ]
                    )
                )

            counts = {
                "categories": await session.scalar(select(func.count()).select_from(Category)),
                "products": await session.scalar(select(func.count()).select_from(Product)),
                "connections": await session.scalar(
                    select(func.count()).select_from(ProductConnection)
                ),
            }
        print(json.dumps(counts))
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
