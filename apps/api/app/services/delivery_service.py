import asyncio
import math
from decimal import Decimal
from typing import Annotated

import httpx
from fastapi import Depends, Request
from pydantic import ValidationError

from app.core.config import Settings
from app.schemas.delivery import DeliveryPoint, DeliveryQuote, Feature, Geometry, Route

ORS_URL = "https://api.heigit.org/openrouteservice/v2/directions/driving-car/geojson"


class DeliveryError(Exception):
    def __init__(self, status: int, code: str, message: str):
        self.status, self.code, self.message = status, code, message
        super().__init__(message)


def delivery_price(settings: Settings) -> Decimal:
    """The demo business fee is independent of provider distance and duration."""
    return settings.delivery_flat_price.quantize(Decimal("0.01"))


class DeliveryService:
    def __init__(self, settings: Settings, client: httpx.AsyncClient):
        self.settings = settings
        self.client = client

    async def quote(self, point: DeliveryPoint) -> DeliveryQuote:
        settings = self.settings
        if not settings.openrouteservice_api_key.get_secret_value() or settings.store_lat is None:
            raise DeliveryError(
                503, "delivery_unavailable", "Доставка пока недоступна. Попробуйте позже."
            )
        try:
            # A total deadline complements httpx's per-operation connect/read/write timeouts.
            async with asyncio.timeout(20):
                response = await self.client.post(
                    ORS_URL,
                    headers={"Authorization": settings.openrouteservice_api_key.get_secret_value()},
                    json={
                        "coordinates": [
                            [settings.store_lon, settings.store_lat],
                            [point.longitude, point.latitude],
                        ]
                    },
                )
        except (httpx.TimeoutException, TimeoutError):
            raise DeliveryError(
                504, "route_timeout", "Расчёт маршрута занял слишком долго. Повторите попытку."
            ) from None
        except httpx.RequestError:
            raise DeliveryError(
                503, "provider_unavailable", "Сервис маршрутов недоступен. Повторите позже."
            ) from None
        if response.status_code in (401, 403):
            raise DeliveryError(
                503, "provider_auth", "Сервис доставки временно не настроен. Попробуйте позже."
            )
        if response.status_code == 429:
            raise DeliveryError(
                503, "provider_quota", "Сервис маршрутов перегружен. Попробуйте позже."
            )
        if response.status_code in (400, 404, 422):
            raise DeliveryError(
                422, "no_route", "Не удалось проложить маршрут. Выберите точку ближе к дороге."
            )
        if response.status_code != 200:
            raise DeliveryError(
                502, "provider_unavailable", "Сервис маршрутов недоступен. Повторите позже."
            )
        try:
            data = response.json()
            if data.get("type") != "FeatureCollection" or not isinstance(
                data.get("features"), list
            ):
                raise ValueError("Invalid GeoJSON collection")
            if not data["features"]:
                raise DeliveryError(
                    422, "no_route", "Маршрут не найден. Выберите другую точку доставки."
                )
            feature = data["features"][0]
            if feature.get("type") != "Feature":
                raise ValueError("Invalid GeoJSON feature")
            summary = feature["properties"]["summary"]
            distance, duration = summary["distance"], summary["duration"]
            if any(
                isinstance(value, bool)
                or not isinstance(value, (int, float))
                or not math.isfinite(value)
                or value <= 0
                or value > 2147483647
                for value in (distance, duration)
            ):
                raise ValueError("Invalid route metrics")
            geometry = Geometry.model_validate(feature["geometry"])
        except (ValueError, KeyError, TypeError, IndexError, AttributeError, ValidationError):
            raise DeliveryError(
                502, "invalid_route", "Сервис вернул некорректный маршрут. Повторите попытку."
            ) from None
        if distance > settings.delivery_max_distance_meters:
            raise DeliveryError(
                422,
                "outside_service_area",
                "Адрес вне зоны доставки. Выберите точку ближе к магазину.",
            )
        # Return only our reviewed contract, not arbitrary provider metadata or error bodies.
        return DeliveryQuote(
            **point.model_dump(),
            distance_meters=math.ceil(distance),
            duration_seconds=math.ceil(duration),
            delivery_price=delivery_price(settings),
            route=Route(features=[Feature(geometry=geometry)]),
        )


def get_delivery_service(request: Request) -> DeliveryService:
    return request.app.state.delivery


Delivery = Annotated[DeliveryService, Depends(get_delivery_service)]
