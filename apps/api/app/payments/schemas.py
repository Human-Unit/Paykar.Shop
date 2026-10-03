from datetime import datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_serializer

from app.payments.provider import Scenario
from app.schemas.order import OrderCreate, OrderOut


class SessionCreate(OrderCreate):
    payment_method: Literal["card"] = "card"
    idempotency_key: UUID


class Confirm(BaseModel):
    model_config = ConfigDict(extra="forbid")
    payment_id: UUID
    scenario: Scenario


class PaymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    order_id: UUID | None
    provider: str
    method: str
    status: str
    amount: Decimal
    currency: str
    provider_reference: str | None
    failure_reason: str | None
    expires_at: datetime

    @field_serializer("amount")
    def money(self, amount: Decimal) -> str:
        return f"{amount:.2f}"


class Confirmation(BaseModel):
    payment: PaymentOut
    order: OrderOut | None = None
