from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Numeric, Text, Uuid, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Payment(Base):
    __tablename__ = "payments"
    __table_args__ = (
        CheckConstraint("amount >= 0"),
        CheckConstraint("currency = 'TJS'"),
        CheckConstraint("provider = 'sandbox' AND method = 'card'"),
        CheckConstraint("status IN ('pending', 'succeeded', 'failed', 'cancelled')"),
        CheckConstraint("order_id IS NULL OR status = 'succeeded'"),
    )
    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    order_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"), unique=True
    )
    idempotency_key: Mapped[UUID] = mapped_column(Uuid, unique=True)
    request_fingerprint: Mapped[str] = mapped_column(Text)
    provider: Mapped[str] = mapped_column(Text, server_default="sandbox")
    method: Mapped[str] = mapped_column(Text, server_default="card")
    status: Mapped[str] = mapped_column(Text, server_default="pending")
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    currency: Mapped[str] = mapped_column(Text, server_default="TJS")
    provider_reference: Mapped[str | None] = mapped_column(Text)
    failure_reason: Mapped[str | None] = mapped_column(Text)
    # Only validated checkout and route data; never PAN, CVV or cardholder form values.
    checkout: Mapped[dict] = mapped_column(JSONB)
    quote: Mapped[dict] = mapped_column(JSONB)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
