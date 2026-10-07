from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    ForeignKey,
    Identity,
    Integer,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class ProductConnection(Base):
    __tablename__ = "product_connections"
    __table_args__ = (
        CheckConstraint(
            "source_product_id <> target_product_id",
            name="ck_product_connections_not_self",
        ),
        CheckConstraint(
            "relation_type IN ('complementary', 'substitute')",
            name="ck_product_connections_relation_type",
        ),
        CheckConstraint("position >= 0", name="ck_product_connections_position"),
        UniqueConstraint(
            "source_product_id",
            "target_product_id",
            "relation_type",
            name="uq_product_connections_pair_type",
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    source_product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"), index=True
    )
    target_product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"), index=True
    )
    relation_type: Mapped[str] = mapped_column(Text, server_default="complementary")
    position: Mapped[int] = mapped_column(Integer, server_default="0")
    is_active: Mapped[bool] = mapped_column(Boolean, server_default=text("true"))
