from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.order import CartItem
from app.schemas.product import ProductOut


class ShoppingPreviewIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    items: list[CartItem] = Field(min_length=1, max_length=48)

    @field_validator("items")
    @classmethod
    def unique_products(cls, items: list[CartItem]) -> list[CartItem]:
        if len({item.product_id for item in items}) != len(items):
            raise ValueError("Duplicate product IDs")
        return items


class ShoppingPreviewItem(BaseModel):
    product_id: int
    requested_quantity: int
    available_quantity: int
    availability: Literal["available", "unavailable", "missing"]
    product: ProductOut | None


class ShoppingPreview(BaseModel):
    items: list[ShoppingPreviewItem]


class CuratedItem(BaseModel):
    model_config = ConfigDict(extra="forbid")
    product_slug: str = Field(min_length=1, max_length=160)
    quantity: int = Field(gt=0, le=99, strict=True)


class CuratedDefinition(BaseModel):
    model_config = ConfigDict(extra="forbid")
    slug: str = Field(pattern=r"^[a-z][a-z0-9-]{0,79}$")
    name: str = Field(min_length=1, max_length=100)
    description: str = Field(min_length=1, max_length=300)
    items: list[CuratedItem] = Field(min_length=1, max_length=48)


class CuratedTemplate(BaseModel):
    id: str
    name: str
    description: str
    items: list[ShoppingPreviewItem]
