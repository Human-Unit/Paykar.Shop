from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_serializer


class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    category_id: int
    name: str
    slug: str
    description: str
    sku: str
    price: Decimal
    old_price: Decimal | None
    unit: str
    image_url: str
    stock_quantity: Decimal
    is_active: bool

    @field_serializer("price", "old_price")
    def money(self, value: Decimal | None) -> str | None:
        return f"{value:.2f}" if value is not None else None


class ProductPage(BaseModel):
    items: list[ProductOut]
    total: int
    page: int
    page_size: int


class ProductConnectionList(BaseModel):
    items: list[ProductOut]


class ProductConnectionGroup(BaseModel):
    source_slug: str
    items: list[ProductOut]


class ProductConnectionBatch(BaseModel):
    items: list[ProductConnectionGroup]


class ProductConnectionBatchIn(BaseModel):
    source_slugs: list[Annotated[str, StringConstraints(min_length=1, max_length=160)]] = Field(
        min_length=1, max_length=48
    )
