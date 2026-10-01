from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_serializer, field_validator


class DeliveryPoint(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    address: str = Field(min_length=5, max_length=300)
    latitude: float = Field(ge=-90, le=90, allow_inf_nan=False)
    longitude: float = Field(ge=-180, le=180, allow_inf_nan=False)


class Geometry(BaseModel):
    type: Literal["LineString"] = "LineString"
    coordinates: list[tuple[float, float]] = Field(min_length=2, max_length=100000)

    @field_validator("coordinates")
    @classmethod
    def valid_coordinates(cls, values: list[tuple[float, float]]) -> list[tuple[float, float]]:
        # ORS/GeoJSON uses longitude first. Comparisons also reject NaN/infinity.
        if any(not (-180 <= lon <= 180 and -90 <= lat <= 90) for lon, lat in values):
            raise ValueError("Invalid geometry coordinates")
        if all(point == values[0] for point in values):
            raise ValueError("Empty route geometry")
        return values


class Feature(BaseModel):
    type: Literal["Feature"] = "Feature"
    geometry: Geometry
    properties: dict[str, str] = Field(default_factory=dict)


class Route(BaseModel):
    type: Literal["FeatureCollection"] = "FeatureCollection"
    features: list[Feature] = Field(min_length=1, max_length=1)


class DeliveryQuote(DeliveryPoint):
    distance_meters: int = Field(gt=0)
    duration_seconds: int = Field(gt=0)
    delivery_price: Decimal
    route: Route

    @field_serializer("delivery_price")
    def money(self, value: Decimal) -> str:
        return f"{value:.2f}"
