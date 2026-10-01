from unittest.mock import AsyncMock

import pytest
from asyncpg import InvalidPasswordError
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy.exc import OperationalError

from app.core.config import Settings
from app.core.database import get_session
from app.main import create_app


@pytest.fixture(autouse=True)
def isolate_settings_environment(monkeypatch):
    for name in Settings.model_fields:
        monkeypatch.delenv(name.upper(), raising=False)


def test_settings_defaults_and_secret_masking():
    settings = Settings(
        _env_file=None, postgres_password="a@b:c", openrouteservice_api_key="private"
    )
    assert settings.delivery_flat_price == 20
    assert settings.db_url().password == "a@b:c"
    assert "private" not in repr(settings)


@pytest.mark.parametrize(
    "values",
    [
        {"store_lat": 38},
        {"store_lat": 91, "store_lon": 68},
        {"store_lat": "nan", "store_lon": 68},
        {"delivery_flat_price": -1},
        {"api_port": 0},
        {"database_url": "sqlite:///invalid"},
        {"database_url": "malformed"},
    ],
)
def test_settings_reject_invalid(values):
    with pytest.raises(ValidationError):
        Settings(_env_file=None, **values)


def test_health_without_database():
    with TestClient(create_app(Settings(_env_file=None))) as client:
        assert client.get("/api/v1/health").json()["status"] == "ok"


@pytest.mark.parametrize(
    "error",
    [
        None,
        OperationalError("private", {}, Exception()),
        TimeoutError(),
        InvalidPasswordError("private"),
    ],
)
def test_db_health_safe_errors(error):
    app = create_app(Settings(_env_file=None))
    session = AsyncMock()
    session.execute.side_effect = error

    async def override():
        yield session

    app.dependency_overrides[get_session] = override
    with TestClient(app) as client:
        response = client.get("/api/v1/health/db")
    assert response.status_code == (503 if error is not None else 200)
    assert "private" not in response.text
    assert str(session.execute.call_args.args[0]) == "SELECT 1"


def test_cors_origin():
    with TestClient(create_app(Settings(_env_file=None))) as client:
        good = client.get("/api/v1/health", headers={"Origin": "http://localhost:3000"})
        bad = client.get("/api/v1/health", headers={"Origin": "https://untrusted.example"})
        assert good.headers["access-control-allow-origin"] == "http://localhost:3000"
        assert "access-control-allow-origin" not in bad.headers
