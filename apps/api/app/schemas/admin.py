import json
import re
from decimal import Decimal
from pathlib import Path
from typing import Annotated, Literal

from pydantic import Field, field_validator, model_validator

from app.schemas.design import StrictModel
from app.schemas.measurement import Measurement

Money = Annotated[Decimal, Field(ge=0, max_digits=12, decimal_places=2, allow_inf_nan=False)]
Stock = Annotated[Decimal, Field(ge=0, max_digits=12, decimal_places=3, allow_inf_nan=False)]
Label = Annotated[str, Field(min_length=1, max_length=200)]
Slug = Annotated[str, Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$", max_length=150)]
PRODUCT_ASSETS = json.loads((Path(__file__).parents[1] / "data/product_assets.json").read_text())


class Login(StrictModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=256)

    @field_validator("email")
    @classmethod
    def email_normalize(cls, value: str) -> str:
        value = value.strip().lower()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
            raise ValueError("Invalid email")
        return value


class AdminCreate(Login):
    password: str = Field(min_length=12, max_length=256)
    display_name: Label
    role: Literal["ADMIN", "MASTER"] = "ADMIN"


class AdminUpdate(StrictModel):
    display_name: Label
    role: Literal["ADMIN", "MASTER"]
    is_active: bool
    password: str | None = Field(default=None, min_length=12, max_length=256)


class ProductEdit(Measurement, StrictModel):
    category_id: int = Field(gt=0)
    name: Label
    slug: Slug
    sku: Label
    description: str = Field(default="", max_length=10000)
    price: Money
    old_price: Money | None = None
    unit: Label
    image_url: str = Field(
        default="", max_length=300, pattern=r"^(?:|/images/[a-zA-Z0-9_/-]+\.(?:webp|png|jpg|jpeg))$"
    )
    stock_quantity: Stock
    is_active: bool = True
    expected_stock: Stock | None = None

    @field_validator("image_url")
    @classmethod
    def known_image(cls, value: str) -> str:
        if value and value not in PRODUCT_ASSETS:
            raise ValueError("Select an existing approved product asset")
        return value

    @model_validator(mode="after")
    def sale(self):
        if self.old_price is not None and self.old_price <= self.price:
            raise ValueError("Previous price must exceed current price")
        return self


class CategoryEdit(StrictModel):
    name: Label
    slug: Slug
    parent_id: int | None = Field(default=None, gt=0)


class StockEdit(StrictModel):
    stock_quantity: Stock
    expected_stock: Stock


class StoreEdit(StrictModel):
    name: Label
    address: Label
    short_address: Label
    city: Label
    latitude: float = Field(ge=-90, le=90, allow_inf_nan=False)
    longitude: float = Field(ge=-180, le=180, allow_inf_nan=False)
    is_active: bool = True
