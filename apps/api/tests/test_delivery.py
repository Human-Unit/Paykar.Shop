import json
from decimal import Decimal

import httpx
import pytest
from httpx import ASGITransport, AsyncClient, MockTransport, Response
from pydantic import ValidationError

from app.core.config import Settings
from app.main import create_app
from app.schemas.delivery import DeliveryPoint
from app.services.delivery_service import DeliveryError, DeliveryService, get_delivery_service

POINT = DeliveryPoint(address="Test street 80", latitude=38.57, longitude=68.78)


def provider_route(distance=6300, duration=820):
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "LineString", "coordinates": [[68.75, 38.55], [68.78, 38.57]]},
                "properties": {"summary": {"distance": distance, "duration": duration}},
            }
        ],
    }


def configured(**kwargs):
    return Settings(
        _env_file=None,
        openrouteservice_api_key="test-private-key",
        store_lat=38.55,
        store_lon=68.75,
        **{
            "delivery_flat_price": Decimal("20.00"),
            "delivery_max_distance_meters": 20000,
            **kwargs,
        },
    )


@pytest.mark.parametrize(
    "values",
    [
        {"latitude": 91, "longitude": 68},
        {"latitude": 38, "longitude": 181},
        {"latitude": "nan", "longitude": 68},
        {"latitude": 38},
        {"latitude": 38, "longitude": "inf"},
    ],
)
def test_invalid_coordinates(values):
    with pytest.raises(ValidationError):
        DeliveryPoint(address="Test street", **values)


async def test_success_ordering_fee_and_sanitized_geometry():
    def handler(request):
        assert str(request.url) == (
            "https://api.heigit.org/openrouteservice/v2/directions/driving-car/geojson"
        )
        assert json.loads(request.content)["coordinates"] == [[68.75, 38.55], [68.78, 38.57]]
        assert request.headers["Authorization"] == "test-private-key"
        return Response(200, json=provider_route(6300.1, 820.1))

    async with AsyncClient(transport=MockTransport(handler)) as client:
        quote = await DeliveryService(
            configured(delivery_flat_price=Decimal("17.50")), client
        ).quote(POINT)
    assert quote.distance_meters == 6301 and quote.duration_seconds == 821
    assert quote.model_dump(mode="json")["delivery_price"] == "17.50"
    assert quote.route.features[0].geometry.coordinates[0] == (68.75, 38.55)
    assert "test-private-key" not in quote.model_dump_json()


@pytest.mark.parametrize(
    "status,code",
    [
        (401, "provider_auth"),
        (403, "provider_auth"),
        (429, "provider_quota"),
        (500, "provider_unavailable"),
        (400, "no_route"),
        (404, "no_route"),
        (422, "no_route"),
    ],
)
async def test_provider_errors(status, code):
    async with AsyncClient(
        transport=MockTransport(lambda _: Response(status, text="private internal upstream"))
    ) as client:
        with pytest.raises(DeliveryError) as exc:
            await DeliveryService(configured(), client).quote(POINT)
    assert exc.value.code == code
    assert "private" not in str(exc.value)


async def test_timeout():
    def handler(request):
        raise httpx.ReadTimeout("private", request=request)

    async with AsyncClient(transport=MockTransport(handler)) as client:
        with pytest.raises(DeliveryError) as exc:
            await DeliveryService(configured(), client).quote(POINT)
    assert exc.value.status == 504 and exc.value.code == "route_timeout"


@pytest.mark.parametrize(
    "body,code",
    [
        ({"type": "FeatureCollection", "features": []}, "no_route"),
        ({"features": [{}]}, "invalid_route"),
        (provider_route(0, 820), "invalid_route"),
        (provider_route(6300, -1), "invalid_route"),
        (provider_route(True, 820), "invalid_route"),
        ([1, 2], "invalid_route"),
        (provider_route(20001, 820), "outside_service_area"),
    ],
)
async def test_malformed_no_route_service_area(body, code):
    async with AsyncClient(transport=MockTransport(lambda _: Response(200, json=body))) as client:
        with pytest.raises(DeliveryError) as exc:
            await DeliveryService(configured(), client).quote(POINT)
    assert exc.value.code == code


@pytest.mark.parametrize(
    "coordinates",
    [
        [[68.75, 38.55]],
        [[68.75, 38.55], [68.75, 38.55]],
        [[68.75, 38.55], [181, 38]],
        [[68.75, 38.55], [68, float("nan")]],
    ],
)
async def test_invalid_geometry(coordinates):
    data = provider_route()
    data["features"][0]["geometry"]["coordinates"] = coordinates
    async with AsyncClient(
        transport=MockTransport(lambda _: Response(200, content=json.dumps(data)))
    ) as client:
        with pytest.raises(DeliveryError) as exc:
            await DeliveryService(configured(), client).quote(POINT)
    assert exc.value.code == "invalid_route"


async def test_missing_configuration_and_api_contract():
    async with AsyncClient(
        transport=MockTransport(lambda _: pytest.fail("Provider must not be called"))
    ) as upstream:
        service = DeliveryService(
            Settings(_env_file=None, openrouteservice_api_key="", store_lat=None, store_lon=None),
            upstream,
        )
        app = create_app(service.settings)
        app.dependency_overrides[get_delivery_service] = lambda: service
        async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
            response = await client.post("/api/v1/delivery/quote", json=POINT.model_dump())
            assert response.status_code == 503
            assert response.json()["detail"]["code"] == "delivery_unavailable"
            config = (await client.get("/api/v1/delivery/config")).json()
            assert config["available"] is False
            assert "key" not in str(config)
            assert (
                await client.post("/api/v1/delivery/quote", json={"address": "a", "latitude": 91})
            ).status_code == 422
