from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Identity,
    Integer,
    Numeric,
    Text,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Product(Base):
    __tablename__ = "products"
    __table_args__ = (
        CheckConstraint("price >= 0"),
        CheckConstraint("old_price >= 0"),
        CheckConstraint("stock_quantity >= 0"),
        CheckConstraint(
            "measurement_mode IN ('PIECE', 'WEIGHT', 'DUAL')", name="product_measurement_mode"
        ),
        CheckConstraint(
            "quantity_step > 0 AND minimum_quantity > 0", name="product_measurement_step"
        ),
        CheckConstraint(
            "(measurement_mode = 'PIECE' AND price_unit = 'PIECE' "
            "AND average_piece_weight_g IS NULL AND quantity_step = 1 AND minimum_quantity <= 99) "
            "OR (measurement_mode = 'WEIGHT' AND price_unit = 'KG' "
            "AND average_piece_weight_g IS NULL) "
            "OR (measurement_mode = 'DUAL' AND price_unit = 'KG' "
            "AND average_piece_weight_g > 0 AND average_piece_weight_g IS NOT NULL)",
            name="product_measurement_configuration",
        ),
    )
    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id", ondelete="RESTRICT"), index=True
    )
    name: Mapped[str] = mapped_column(Text)
    slug: Mapped[str] = mapped_column(Text, unique=True)
    description: Mapped[str] = mapped_column(Text, server_default="")
    sku: Mapped[str] = mapped_column(Text, unique=True)
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    old_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    unit: Mapped[str] = mapped_column(Text)
    measurement_mode: Mapped[str] = mapped_column(Text, server_default="PIECE")
    price_unit: Mapped[str] = mapped_column(Text, server_default="PIECE")
    average_piece_weight_g: Mapped[int | None] = mapped_column(Integer)
    quantity_step: Mapped[int] = mapped_column(Integer, server_default="1")
    minimum_quantity: Mapped[int] = mapped_column(Integer, server_default="1")
    image_url: Mapped[str] = mapped_column(Text, server_default="")
    stock_quantity: Mapped[Decimal] = mapped_column(Numeric(12, 3), server_default="0")
    is_active: Mapped[bool] = mapped_column(Boolean, server_default=text("true"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
