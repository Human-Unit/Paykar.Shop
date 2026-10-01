from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import Settings


def make_engine(settings: Settings):
    return create_async_engine(
        settings.db_url(), pool_pre_ping=True, connect_args={"timeout": 5}, echo=False
    )


async def get_session(request: Request) -> AsyncIterator[AsyncSession]:
    factory: async_sessionmaker[AsyncSession] = request.app.state.sessions
    async with factory() as session:
        yield session


Session = Annotated[AsyncSession, Depends(get_session)]
