from contextlib import asynccontextmanager

import httpx
from asyncpg import PostgresError
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.api.router import router
from app.core.config import Settings
from app.core.database import make_engine
from app.services.delivery_service import DeliveryError, DeliveryService


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or Settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        engine = make_engine(settings)
        app.state.sessions = async_sessionmaker(engine, expire_on_commit=False)
        try:
            async with httpx.AsyncClient(
                timeout=httpx.Timeout(12, connect=5, write=5, pool=5), follow_redirects=False
            ) as client:
                app.state.delivery = DeliveryService(settings, client)
                yield
        finally:
            await engine.dispose()

    app = FastAPI(title="Paykar demo API", version="0.1.0", lifespan=lifespan)
    app.state.settings = settings

    @app.exception_handler(RequestValidationError)
    async def invalid_request(request: Request, exc: RequestValidationError):
        # Never reflect submitted card-like fields or other request bodies in validation responses.
        return JSONResponse(
            status_code=422,
            content={
                "detail": {
                    "code": "invalid_input",
                    "message": "Проверьте введённые данные.",
                    "fields": [
                        ".".join(str(part) for part in item["loc"]) for item in exc.errors()
                    ],
                }
            },
        )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.web_origin],
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type"],
    )

    @app.exception_handler(SQLAlchemyError)
    @app.exception_handler(PostgresError)
    @app.exception_handler(OSError)
    async def database_error(request: Request, exc: Exception):
        return JSONResponse(
            status_code=503, content={"detail": "Магазин временно недоступен. Повторите позже."}
        )

    @app.exception_handler(DeliveryError)
    async def delivery_error(request: Request, exc: DeliveryError):
        return JSONResponse(
            status_code=exc.status, content={"detail": {"code": exc.code, "message": exc.message}}
        )

    app.include_router(router)
    return app


app = create_app()
