import re
from datetime import datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    computed_field,
    field_serializer,
    field_validator,
    model_validator,
)

from app.schemas.delivery import DeliveryPoint


class CartItem(BaseModel):
    model_config = ConfigDict(extra="forbid")
    product_id: int = Field(gt=0, le=9223372036854775807, strict=True)
    quantity: int | None = Field(default=None, gt=0, le=99, strict=True)
    purchase_mode: Literal["PIECE", "WEIGHT"] | None = None
    piece_count: int | None = Field(default=None, gt=0, le=99, strict=True)
    requested_weight_g: int | None = Field(default=None, gt=0, le=99000, strict=True)

    @model_validator(mode="after")
    def one_quantity(self):
        if self.purchase_mode is None:
            valid = (
                self.quantity is not None
                and self.piece_count is None
                and self.requested_weight_g is None
            )
        elif self.purchase_mode == "PIECE":
            valid = (
                self.quantity is None
                and self.piece_count is not None
                and self.requested_weight_g is None
            )
        else:
            valid = (
                self.quantity is None
                and self.piece_count is None
                and self.requested_weight_g is not None
            )
        if not valid:
            raise ValueError("Provide exactly one quantity for the selected purchase mode")
        return self


class OrderCreate(DeliveryPoint):
    payment_method: Literal["cash", "card"] = "cash"
    idempotency_key: UUID | None = None
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
    purchase_mode: str = "PIECE"
    requested_piece_count: int | None = None
    requested_weight_g: int | None = None
    estimated_weight_g: int | None = None
    average_piece_weight_g_snapshot: int | None = None
    price_unit_snapshot: str = "PIECE"
    actual_weight_g: int | None = None
    is_estimated: bool = False

    @computed_field
    @property
    def estimated_line_total(self) -> str:
        return f"{self.total_price:.2f}"

    @computed_field
    @property
    def final_line_total(self) -> str:
        if self.actual_weight_g is not None and self.price_unit_snapshot == "KG":
            from decimal import ROUND_HALF_UP

            amount = self.unit_price * Decimal(self.actual_weight_g) / 1000
            return f"{amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP):.2f}"
        return self.estimated_line_total

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
    payment_method: str
    payment_status: str

    @computed_field
    @property
    def estimated_order_total(self) -> str:
        return f"{self.total:.2f}"

    @computed_field
    @property
    def final_order_total(self) -> str:
        total = sum((Decimal(item.final_line_total) for item in self.items), self.delivery_price)
        return f"{total:.2f}"

    @computed_field
    @property
    def is_estimated(self) -> bool:
        return any(item.is_estimated for item in self.items)

    @field_serializer("subtotal", "delivery_price", "total")
    def money(self, value: Decimal) -> str:
        return f"{value:.2f}"
