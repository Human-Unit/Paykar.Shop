import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from typing import Annotated

from argon2 import PasswordHasher
from argon2.exceptions import VerificationError
from fastapi import Depends, HTTPException, Request
from sqlalchemy import delete, select, text
from starlette.concurrency import run_in_threadpool

from app.core.database import Session
from app.models import AdminAudit, AdminSession, AdminUser, LoginLimit

hasher = PasswordHasher()
DUMMY_HASH = hasher.hash(secrets.token_urlsafe(32))
COOKIE = "paykar_admin"


def digest(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def verify_password(encoded: str, password: str) -> bool:
    try:
        return hasher.verify(encoded, password)
    except VerificationError:
        return False


def require_origin(request: Request):
    if request.headers.get("origin") != request.app.state.settings.web_origin:
        raise HTTPException(403, "Untrusted request origin")


async def current_admin(request: Request, session: Session) -> AdminUser:
    token = request.cookies.get(COOKIE, "")
    if not token or len(token) > 100:
        raise HTTPException(401, "Sign in required")
    result = await session.execute(
        select(AdminSession, AdminUser)
        .join(AdminUser, AdminUser.id == AdminSession.user_id)
        .where(
            AdminSession.token_hash == digest(token),
            AdminSession.expires_at > datetime.now(UTC),
            AdminUser.is_active.is_(True),
        )
    )
    row = result.first()
    if row is None:
        raise HTTPException(401, "Sign in required")
    record, user = row
    if request.method != "GET":
        require_origin(request)
        if not secrets.compare_digest(request.headers.get("x-admin-csrf", ""), record.csrf):
            raise HTTPException(403, "Invalid request token")
    request.state.admin_csrf = record.csrf
    return user


Admin = Annotated[AdminUser, Depends(current_admin)]


async def current_master(user: Admin) -> AdminUser:
    if user.role != "MASTER":
        raise HTTPException(403, "MASTER permission required")
    return user


Master = Annotated[AdminUser, Depends(current_master)]


async def login_user(request: Request, session, email: str, password: str):
    require_origin(request)
    now = datetime.now(UTC)
    # Persistent, per-account throttle shared across API workers; no raw email/IP logs.
    key = digest(email)
    # A shared proxy/IP budget also bounds unknown-account spray and hash concurrency.
    global_key = digest("login-budget:" + (request.client.host if request.client else "unknown"))
    await session.execute(text("SELECT pg_advisory_xact_lock(74104)"))
    await session.execute(text("SELECT pg_advisory_xact_lock(:key)"), {"key": int(key[:15], 16)})
    await session.execute(delete(LoginLimit).where(LoginLimit.expires_at <= now))
    await session.execute(delete(AdminSession).where(AdminSession.expires_at <= now))
    global_limit = await session.get(LoginLimit, global_key)
    if global_limit and global_limit.attempts >= 64:
        await session.commit()
        raise HTTPException(429, "Too many attempts. Try again in 15 minutes.")
    if not global_limit:
        global_limit = LoginLimit(
            key=global_key, attempts=0, expires_at=now + timedelta(minutes=15)
        )
        session.add(global_limit)
    limit = await session.get(LoginLimit, key)
    if limit and limit.attempts >= 8:
        await session.commit()
        raise HTTPException(429, "Too many attempts. Try again in 15 minutes.")
    if not limit:
        limit = LoginLimit(key=key, attempts=0, expires_at=now + timedelta(minutes=15))
        session.add(limit)
    user = await session.scalar(select(AdminUser).where(AdminUser.email == email))
    valid = await run_in_threadpool(
        verify_password, user.password_hash if user else DUMMY_HASH, password
    )
    if not valid or not user or not user.is_active:
        limit.attempts += 1
        global_limit.attempts += 1
        await session.commit()
        raise HTTPException(401, "Invalid email or password")
    await session.delete(limit)
    if hasher.check_needs_rehash(user.password_hash):
        user.password_hash = await run_in_threadpool(hasher.hash, password)
    user.last_login_at = now
    # Replace the presented session, avoiding session fixation and orphaned relogins.
    old = request.cookies.get(COOKIE)
    if old:
        await session.execute(delete(AdminSession).where(AdminSession.token_hash == digest(old)))
    token = secrets.token_urlsafe(32)
    csrf = secrets.token_urlsafe(32)
    session.add(
        AdminSession(
            token_hash=digest(token),
            user_id=user.id,
            csrf=csrf,
            expires_at=now + timedelta(hours=request.app.state.settings.admin_session_hours),
        )
    )
    await session.commit()
    return user, token, csrf


def audit(session, user: AdminUser, action: str, target: object):
    session.add(AdminAudit(actor_id=user.id, action=action, target=str(target)))


def user_public(user: AdminUser) -> dict:
    return {
        key: getattr(user, key)
        for key in (
            "id",
            "email",
            "display_name",
            "role",
            "is_active",
            "created_at",
            "updated_at",
            "last_login_at",
        )
    }
