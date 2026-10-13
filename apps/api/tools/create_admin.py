"""Administrator bootstrap. Never accepts passwords in argv or prints them."""

import argparse
import asyncio
import getpass
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import func, select, text  # noqa: E402
from sqlalchemy.ext.asyncio import async_sessionmaker  # noqa: E402

from app.core.config import Settings  # noqa: E402
from app.core.database import make_engine  # noqa: E402
from app.models import AdminAudit, AdminUser  # noqa: E402
from app.schemas.admin import AdminCreate  # noqa: E402
from app.services.admin_auth import hasher  # noqa: E402


async def create(body, *, only_if_empty=False):
    engine = make_engine(Settings())
    try:
        async with async_sessionmaker(engine).begin() as session:
            await session.execute(text("SELECT pg_advisory_xact_lock(74102)"))
            if only_if_empty and await session.scalar(select(AdminUser.id).limit(1)):
                print("Presentation bootstrap skipped: administrators already exist.")
                return False
            if await session.scalar(select(AdminUser.id).where(AdminUser.email == body.email)):
                raise ValueError("Administrator already exists; no changes made")
            masters = await session.scalar(
                select(func.count())
                .select_from(AdminUser)
                .where(AdminUser.role == "MASTER", AdminUser.is_active.is_(True))
            )
            if not masters and body.role != "MASTER":
                raise ValueError("First administrator must be MASTER")
            user = AdminUser(
                **body.model_dump(exclude={"password"}), password_hash=hasher.hash(body.password)
            )
            session.add(user)
            await session.flush()
            session.add(
                AdminAudit(actor_id=user.id, action="administrator.bootstrap", target=str(user.id))
            )
        print("Administrator created. Sign in at /admin/login.")
        return True
    finally:
        await engine.dispose()


def presentation_account(environ):
    enabled = environ.get("PRESENTATION_ADMIN_ENABLED", "false").strip().lower()
    if enabled == "false":
        return None
    if enabled != "true":
        raise ValueError("PRESENTATION_ADMIN_ENABLED must be true or false")
    try:
        return AdminCreate(
            email=environ.get("PRESENTATION_ADMIN_EMAIL", ""),
            display_name=environ.get("PRESENTATION_ADMIN_NAME", ""),
            password=environ.get("PRESENTATION_ADMIN_PASSWORD", ""),
            role="MASTER",
        )
    except ValueError:
        # Validation errors include input values, potentially the password.
        raise ValueError(
            "Presentation bootstrap needs a valid email, name and password of 12-256 characters."
        ) from None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--email")
    parser.add_argument("--name")
    parser.add_argument("--role", choices=["ADMIN", "MASTER"], default="MASTER")
    parser.add_argument(
        "--from-env", action="store_true", help="Opt-in Docker presentation bootstrap; no prompts."
    )
    args = parser.parse_args()
    if args.from_env:
        try:
            body = presentation_account(os.environ)
        except ValueError as error:
            raise SystemExit(str(error)) from None
        if body is not None:
            asyncio.run(create(body, only_if_empty=True))
        return
    email = args.email or input("Email: ")
    name = args.name or input("Display name: ")
    password = getpass.getpass("Password (at least 12 characters): ")
    if password != getpass.getpass("Confirm password: "):
        raise SystemExit("Passwords differ; no changes made")
    try:
        body = AdminCreate(email=email, display_name=name, password=password, role=args.role)
        asyncio.run(create(body))
    except ValueError:
        # Pydantic errors can include submitted passwords; never print their input.
        raise SystemExit(
            "Creation failed. Check email/name, password length, role or duplicate account."
        ) from None


if __name__ == "__main__":
    main()
