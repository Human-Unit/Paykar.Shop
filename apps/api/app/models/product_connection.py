from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Identity,
    Integer,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class ProductConnection(Base):
    __tablename__ = "product_connections"
    __table_args__ = (
        CheckConstraint(
            "source_product_id <> target_product_id", name="ck_product_connections_distinct"
        ),
        CheckConstraint("relation_type = 'complementary'", name="ck_product_connections_type"),
        CheckConstraint("position >= 0", name="ck_product_connections_position"),
        UniqueConstraint(
            "source_product_id", "target_product_id", name="uq_product_connections_pair"
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    source_product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="RESTRICT"), nullable=False
    )
    target_product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="RESTRICT"), nullable=False
    )
    relation_type: Mapped[str] = mapped_column(Text, nullable=False, server_default="complementary")
    position: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
