"""Verify the backend without pointing integration tests at application data."""

import asyncio
import os
import re
import subprocess
import sys
from pathlib import Path
from uuid import uuid4

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.core.config import Settings  # noqa: E402


async def verify():
    settings = Settings()
    name = f"paykar_verify_{uuid4().hex[:12]}_test"
    assert re.fullmatch(r"paykar_verify_[0-9a-f]{12}_test", name)
    admin = create_async_engine(
        settings.db_url().set(database="postgres"), isolation_level="AUTOCOMMIT"
    )
    created = False
    try:
        async with admin.connect() as connection:
            await connection.execute(text(f'CREATE DATABASE "{name}"'))
            created = True
        url = settings.db_url().set(database=name).render_as_string(hide_password=False)
        env = {**os.environ, "DATABASE_URL": url, "TEST_DATABASE_URL": url, "POSTGRES_DB": name}
        print(f"Verification database: {name}", flush=True)
        for command in [
            ["python", "-m", "compileall", "-q", "app", "tools"],
            ["ruff", "check", "."],
            ["ruff", "format", "--check", "."],
            ["alembic", "upgrade", "head"],
            ["alembic", "current"],
            ["alembic", "check"],
            ["pytest", "-q"],
        ]:
            subprocess.run(command, cwd=ROOT, env=env, check=True)
    finally:
        if created:
            async with admin.connect() as connection:
                await connection.execute(text(f'DROP DATABASE "{name}" WITH (FORCE)'))
            print(f"Removed verification database: {name}", flush=True)
        await admin.dispose()


if __name__ == "__main__":
    try:
        asyncio.run(verify())
    except subprocess.CalledProcessError as error:
        raise SystemExit(error.returncode) from None
