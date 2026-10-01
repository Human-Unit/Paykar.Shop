from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, DateTime, Float, Integer, Numeric, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Order(Base):
    __tablename__ = "orders"
    __table_args__ = (
        CheckConstraint("latitude BETWEEN -90 AND 90"),
        CheckConstraint("longitude BETWEEN -180 AND 180"),
        CheckConstraint("(latitude IS NULL) = (longitude IS NULL)"),
        CheckConstraint("subtotal >= 0"),
        CheckConstraint("delivery_price >= 0"),
        CheckConstraint("total >= 0 AND total = subtotal + delivery_price"),
        CheckConstraint("distance_meters >= 0"),
        CheckConstraint("delivery_duration_seconds >= 0"),
        CheckConstraint(
            "status IN ('pending', 'confirmed', 'delivering', 'completed', 'cancelled')"
        ),
    )
    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    customer_name: Mapped[str] = mapped_column(Text)
    phone: Mapped[str] = mapped_column(Text)
    address: Mapped[str] = mapped_column(Text)
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    delivery_price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    distance_meters: Mapped[int | None] = mapped_column(Integer)
    delivery_duration_seconds: Mapped[int | None] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(Text, server_default="pending")
    comment: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
