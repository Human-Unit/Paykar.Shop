from decimal import Decimal

from pydantic import Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import URL, make_url
from sqlalchemy.exc import ArgumentError


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=("../../.env", ".env"), extra="ignore")
    database_url: SecretStr | None = None
    postgres_host: str = "localhost"
    postgres_port: int = Field(default=5433, ge=1, le=65535)
    postgres_db: str = "paykar"
    postgres_user: str = "paykar"
    postgres_password: SecretStr = SecretStr("paykar_dev")
    api_host: str = "0.0.0.0"
    api_port: int = Field(default=8080, ge=1, le=65535)
    web_origin: str = "http://localhost:3000"
    openrouteservice_api_key: SecretStr = SecretStr("")
    store_address: str = "Айни 16б, Душанбе, Таджикистан"
    store_lat: float | None = Field(default=None, ge=-90, le=90, allow_inf_nan=False)
    store_lon: float | None = Field(default=None, ge=-180, le=180, allow_inf_nan=False)
    delivery_flat_price: Decimal = Field(
        default=Decimal("20.00"), ge=0, max_digits=12, decimal_places=2, allow_inf_nan=False
    )
    delivery_max_distance_meters: int = Field(default=20000, gt=0, le=1000000)

    @field_validator("store_lat", "store_lon", mode="before")
    @classmethod
    def blank_coordinate(cls, value: object) -> object:
        return None if value == "" else value

    @field_validator("database_url")
    @classmethod
    def async_postgres_url(cls, value: SecretStr | None) -> SecretStr | None:
        if value:
            try:
                driver = make_url(value.get_secret_value()).drivername
            except ArgumentError:
                raise ValueError("DATABASE_URL must be a valid SQLAlchemy URL") from None
            if driver != "postgresql+asyncpg":
                raise ValueError("DATABASE_URL must use postgresql+asyncpg")
        return value

    @model_validator(mode="after")
    def coordinate_pair(self) -> "Settings":
        if (self.store_lat is None) != (self.store_lon is None):
            raise ValueError("STORE_LAT and STORE_LON must be configured together")
        return self

    def db_url(self) -> URL:
        if self.database_url:
            return make_url(self.database_url.get_secret_value())
        return URL.create(
            "postgresql+asyncpg",
            username=self.postgres_user,
            password=self.postgres_password.get_secret_value(),
            host=self.postgres_host,
            port=self.postgres_port,
            database=self.postgres_db,
        )
