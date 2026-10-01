import asyncio

from asyncpg import PostgresError
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.core.database import Session

router = APIRouter()


@router.get("/health")
async def health():
    return {"status": "ok", "service": "paykar-api"}


@router.get("/health/db")
async def db_health(session: Session):
    try:
        async with asyncio.timeout(2):
            await session.execute(text("SELECT 1"))
    except (SQLAlchemyError, PostgresError, OSError, TimeoutError):
        return JSONResponse(
            status_code=503, content={"status": "unavailable", "database": "disconnected"}
        )
    return {"status": "ok", "database": "connected"}
