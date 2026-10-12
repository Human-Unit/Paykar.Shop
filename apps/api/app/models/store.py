from sqlalchemy import Boolean, CheckConstraint, Float, Identity, Integer, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Store(Base):
    __tablename__ = "stores"
    __table_args__ = (
        CheckConstraint("latitude BETWEEN -90 AND 90"),
        CheckConstraint("longitude BETWEEN -180 AND 180"),
    )
    id: Mapped[int] = mapped_column(Integer, Identity(), primary_key=True)
    name: Mapped[str] = mapped_column(Text)
    address: Mapped[str] = mapped_column(Text)
    short_address: Mapped[str] = mapped_column(Text)
    city: Mapped[str] = mapped_column(Text)
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    is_active: Mapped[bool] = mapped_column(Boolean, server_default=text("true"))
