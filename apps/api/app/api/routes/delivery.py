from fastapi import APIRouter, Request

from app.schemas.delivery import DeliveryPoint, DeliveryQuote
from app.services.delivery_service import Delivery, delivery_price

router = APIRouter(prefix="/delivery", tags=["delivery"])


@router.get("/config")
async def config(request: Request):
    settings = request.app.state.settings
    return {
        "store_address": settings.store_address,
        "store_lat": settings.store_lat,
        "store_lon": settings.store_lon,
        "available": bool(settings.openrouteservice_api_key.get_secret_value())
        and settings.store_lat is not None,
        "delivery_price": f"{delivery_price(settings):.2f}",
        "max_distance_meters": settings.delivery_max_distance_meters,
    }


@router.post("/quote", response_model=DeliveryQuote)
async def quote(point: DeliveryPoint, delivery: Delivery):
    return await delivery.quote(point)
