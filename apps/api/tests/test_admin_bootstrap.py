import asyncio
import os
from uuid import uuid4

import pytest
from sqlalchemy import delete, func, select
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.models import AdminAudit, AdminUser
from app.schemas.admin import AdminCreate
from app.services.admin_auth import hasher
from tools import create_admin

PASSWORD = "bootstrap-integration-only-password"


def test_presentation_bootstrap_disabled_by_default():
    assert create_admin.presentation_account({}) is None
    assert create_admin.presentation_account({"PRESENTATION_ADMIN_ENABLED": "false"}) is None


@pytest.mark.parametrize(
    "changes",
    [
        {"PRESENTATION_ADMIN_ENABLED": "maybe"},
        {"PRESENTATION_ADMIN_EMAIL": "invalid"},
        {"PRESENTATION_ADMIN_NAME": ""},
        {"PRESENTATION_ADMIN_PASSWORD": "short"},
    ],
)
def test_presentation_bootstrap_invalid_configuration_does_not_expose_password(changes):
    environ = {
        "PRESENTATION_ADMIN_ENABLED": "true",
        "PRESENTATION_ADMIN_EMAIL": "presenter@example.test",
        "PRESENTATION_ADMIN_NAME": "Presenter",
        "PRESENTATION_ADMIN_PASSWORD": PASSWORD,
        **changes,
    }
    with pytest.raises(ValueError) as error:
        create_admin.presentation_account(environ)
    assert environ["PRESENTATION_ADMIN_PASSWORD"] not in str(error.value)


def test_presentation_bootstrap_master_and_normalization():
    body = create_admin.presentation_account(
        {
            "PRESENTATION_ADMIN_ENABLED": " TRUE ",
            "PRESENTATION_ADMIN_EMAIL": "Presenter@Example.test",
            "PRESENTATION_ADMIN_NAME": "Presenter",
            "PRESENTATION_ADMIN_PASSWORD": PASSWORD,
        }
    )
    assert body.role == "MASTER"
    assert body.email == "presenter@example.test"


@pytest.mark.asyncio
async def test_presentation_bootstrap_serialized_and_preserves_existing_accounts(monkeypatch):
    url = os.environ["TEST_DATABASE_URL"]
    assert make_url(url).database.endswith("_test")
    engine = create_async_engine(url)
    sessions = async_sessionmaker(engine)
    suffix = uuid4().hex
    bodies = [
        AdminCreate(
            email=f"bootstrap-{i}-{suffix}@example.test",
            display_name="Presentation",
            password=PASSWORD,
            role="MASTER",
        )
        for i in range(2)
    ]
    monkeypatch.setattr(create_admin, "make_engine", lambda _: create_async_engine(url))
    try:
        async with sessions() as session:
            assert await session.scalar(select(func.count()).select_from(AdminUser)) == 0
        results = await asyncio.gather(
            *(create_admin.create(body, only_if_empty=True) for body in bodies)
        )
        assert sorted(results) == [False, True]
        async with sessions.begin() as session:
            user = await session.scalar(select(AdminUser))
            original_hash = user.password_hash
            identifier = user.id
            assert hasher.verify(original_hash, PASSWORD)
            assert user.role == "MASTER"
            user.is_active = False
            user.role = "ADMIN"
        # Neither a matching nor a different email reactivates/promotes/resets a user.
        for body in bodies:
            body.password = "different-integration-only-password"
            assert not await create_admin.create(body, only_if_empty=True)
        async with sessions() as session:
            user = await session.get(AdminUser, identifier)
            assert user.password_hash == original_hash
            assert not user.is_active
            assert user.role == "ADMIN"
            assert await session.scalar(select(func.count()).select_from(AdminUser)) == 1
            assert (
                await session.scalar(
                    select(func.count())
                    .select_from(AdminAudit)
                    .where(AdminAudit.actor_id == identifier)
                )
                == 1
            )
    finally:
        async with sessions.begin() as session:
            ids = select(AdminUser.id).where(AdminUser.email.contains(suffix))
            await session.execute(delete(AdminAudit).where(AdminAudit.actor_id.in_(ids)))
            await session.execute(delete(AdminUser).where(AdminUser.email.contains(suffix)))
        await engine.dispose()
