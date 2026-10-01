import re
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_serializer, field_validator

from app.schemas.delivery import DeliveryPoint


class CartItem(BaseModel):
    model_config = ConfigDict(extra="forbid")
    product_id: int = Field(gt=0, le=9223372036854775807, strict=True)
    quantity: int = Field(gt=0, le=99, strict=True)


class OrderCreate(DeliveryPoint):
    customer_name: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=7, max_length=30)
    comment: str | None = Field(default=None, max_length=1000)
    items: list[CartItem] = Field(min_length=1, max_length=48)
    expected_total: Decimal = Field(ge=0, max_digits=12, decimal_places=2, allow_inf_nan=False)

    @field_validator("phone")
    @classmethod
    def valid_phone(cls, value: str) -> str:
        if not re.fullmatch(r"\+?[\d ()-]+", value):
            raise ValueError("Введите телефон: от 7 до 15 цифр")
        digits = re.sub(r"\D", "", value)
        if not 7 <= len(digits) <= 15 or not digits.isascii():
            raise ValueError("Введите телефон: от 7 до 15 цифр")
        return ("+" if value.startswith("+") else "") + digits


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    product_id: int
    product_name: str
    quantity: Decimal
    unit_price: Decimal
    total_price: Decimal

    @field_serializer("quantity")
    def quantity_string(self, value: Decimal) -> str:
        return f"{value:.3f}"

    @field_serializer("unit_price", "total_price")
    def money(self, value: Decimal) -> str:
        return f"{value:.2f}"


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    customer_name: str
    address: str
    latitude: float
    longitude: float
    subtotal: Decimal
    delivery_price: Decimal
    total: Decimal
    distance_meters: int
    delivery_duration_seconds: int
    status: str
    created_at: datetime
    items: list[OrderItemOut]

    @field_serializer("subtotal", "delivery_price", "total")
    def money(self, value: Decimal) -> str:
        return f"{value:.2f}"
