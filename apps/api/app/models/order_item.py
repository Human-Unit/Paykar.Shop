from decimal import Decimal
from uuid import UUID

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    ForeignKey,
    Identity,
    Integer,
    Numeric,
    Text,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class OrderItem(Base):
    __tablename__ = "order_items"
    __table_args__ = (
        CheckConstraint("quantity > 0"),
        CheckConstraint("unit_price >= 0"),
        CheckConstraint("total_price >= 0 AND total_price = ROUND(quantity * unit_price, 2)"),
        CheckConstraint(
            "actual_weight_g IS NULL OR actual_weight_g > 0", name="order_item_actual_weight"
        ),
    )
    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    order_id: Mapped[UUID] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="RESTRICT"), index=True
    )
    product_name: Mapped[str] = mapped_column(Text)
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 3))
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    total_price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    purchase_mode: Mapped[str] = mapped_column(Text, server_default="PIECE")
    requested_piece_count: Mapped[int | None] = mapped_column(Integer)
    requested_weight_g: Mapped[int | None] = mapped_column(Integer)
    estimated_weight_g: Mapped[int | None] = mapped_column(Integer)
    average_piece_weight_g_snapshot: Mapped[int | None] = mapped_column(Integer)
    price_unit_snapshot: Mapped[str] = mapped_column(Text, server_default="PIECE")
    actual_weight_g: Mapped[int | None] = mapped_column(Integer)
    is_estimated: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
