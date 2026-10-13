from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, Request, Response
from sqlalchemy import String, cast, delete, func, select, text, update
from sqlalchemy.exc import IntegrityError
from starlette.concurrency import run_in_threadpool

from app.core.database import Session
from app.models import (
    AdminAudit,
    AdminSession,
    AdminUser,
    Category,
    DesignConfig,
    Order,
    OrderItem,
    Product,
    Store,
)
from app.schemas.admin import (
    PRODUCT_ASSETS,
    AdminCreate,
    AdminUpdate,
    CategoryEdit,
    Login,
    ProductEdit,
    StockEdit,
    StoreEdit,
)
from app.schemas.design import PaykarDesign
from app.services.admin_auth import (
    COOKIE,
    Admin,
    Master,
    audit,
    current_admin,
    digest,
    hasher,
    login_user,
    user_public,
)

router = APIRouter(prefix="/admin", tags=["administration"])
public_router = APIRouter(tags=["public configuration"])


@router.get("/product-assets")
async def product_assets(user: Admin):
    return PRODUCT_ASSETS


async def commit(session):
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(409, "Conflicting value or dependent record") from None


async def record(session, model, identifier, *, lock=False):
    query = select(model).where(model.id == identifier)
    value = await session.scalar(query.with_for_update() if lock else query)
    if value is None:
        raise HTTPException(404, "Record not found")
    return value


def row(value, excluded=()):
    return {
        column.name: getattr(value, column.name)
        for column in value.__table__.columns
        if column.name not in excluded
    }


async def resource_list(session, model, conditions, ordering, page, serialize=row):
    query = select(model).where(*conditions).order_by(ordering, model.id)
    if page is None:
        # Existing consumers (e.g. category options) retain their array contract.
        return [serialize(item) for item in await session.scalars(query)]
    total = await session.scalar(select(func.count()).select_from(model).where(*conditions))
    values = await session.scalars(query.offset((page - 1) * 25).limit(25))
    return {
        "items": [serialize(item) for item in values],
        "total": total,
        "page": page,
        "page_size": 25,
    }


@router.post("/auth/login")
async def login(body: Login, request: Request, response: Response, session: Session):
    user, token, csrf = await login_user(request, session, body.email, body.password)
    response.set_cookie(
        COOKIE,
        token,
        max_age=request.app.state.settings.admin_session_hours * 3600,
        httponly=True,
        secure=request.app.state.settings.admin_cookie_secure,
        samesite="strict",
        path="/api",
    )
    return {"user": user_public(user), "csrf": csrf}


@router.get("/auth/me")
async def me(request: Request, user: Admin):
    return {"user": user_public(user), "csrf": request.state.admin_csrf}


@router.get("/auth/design-access")
async def design_access(request: Request, response: Response, session: Session):
    """Small, no-store storefront gate; draft data still requires Master."""
    response.headers["Cache-Control"] = "no-store"
    try:
        user = await current_admin(request, session)
    except HTTPException as exc:
        if exc.status_code == 401:
            return {"enabled": False}
        raise
    if user.role != "MASTER":
        return {"enabled": False}
    return {
        "enabled": True,
        "identity": {"user": user_public(user), "csrf": request.state.admin_csrf},
    }


@router.post("/auth/logout")
async def logout(request: Request, response: Response, session: Session, user: Admin):
    await session.execute(
        delete(AdminSession).where(AdminSession.token_hash == digest(request.cookies[COOKIE]))
    )
    await session.commit()
    response.delete_cookie(
        COOKIE,
        path="/api",
        httponly=True,
        secure=request.app.state.settings.admin_cookie_secure,
        samesite="strict",
    )
    return {"ok": True}


@router.get("/overview")
async def overview(session: Session, user: Admin):
    metrics = {}
    for name, model, conditions in [
        ("products", Product, []),
        ("active_products", Product, [Product.is_active.is_(True)]),
        ("out_of_stock", Product, [Product.is_active.is_(True), Product.stock_quantity <= 0]),
        ("categories", Category, []),
        ("orders", Order, []),
        ("stores", Store, [Store.is_active.is_(True)]),
        ("promotions", Product, [Product.is_active.is_(True), Product.old_price > Product.price]),
    ]:
        metrics[name] = await session.scalar(
            select(func.count()).select_from(model).where(*conditions)
        )
    return metrics


@router.get("/products")
async def products(
    session: Session,
    user: Admin,
    q: str = Query(default="", max_length=100),
    category_id: int | None = None,
    stock: str = Query(default="all", pattern="^(all|available|empty)$"),
    sale: bool = False,
    sort: str = Query(default="id", pattern="^(id|name|price|-price|stock|-updated)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
):
    conditions = []
    if q:
        conditions.append(
            Product.name.ilike(f"%{q.replace('%', '').replace('_', '')}%")
            | Product.sku.ilike(f"%{q.replace('%', '').replace('_', '')}%")
        )
    if category_id:
        conditions.append(Product.category_id == category_id)
    if stock != "all":
        conditions.append(
            Product.stock_quantity > 0 if stock == "available" else Product.stock_quantity <= 0
        )
    if sale:
        conditions.append(Product.old_price > Product.price)
    total = await session.scalar(select(func.count()).select_from(Product).where(*conditions))
    items = await session.scalars(
        select(Product)
        .where(*conditions)
        .order_by(
            {
                "id": Product.id,
                "name": Product.name,
                "price": Product.price,
                "-price": Product.price.desc(),
                "stock": Product.stock_quantity,
                "-updated": Product.updated_at.desc(),
            }[sort],
            Product.id,
        )
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return {"items": [row(p) for p in items], "total": total, "page": page, "page_size": page_size}


@router.get("/products/{identifier}")
async def product_detail(identifier: int, session: Session, user: Admin):
    return row(await record(session, Product, identifier))


@router.post("/products", status_code=201)
async def create_product(body: ProductEdit, session: Session, user: Admin):
    await record(session, Category, body.category_id)
    product = Product(**body.model_dump(exclude={"expected_stock"}))
    session.add(product)
    audit(session, user, "product.created", body.sku)
    await commit(session)
    return row(product)


@router.post("/products/{identifier}")
async def edit_product(identifier: int, body: ProductEdit, session: Session, user: Admin):
    await record(session, Category, body.category_id)
    product = await record(session, Product, identifier, lock=True)
    if body.expected_stock is None or product.stock_quantity != body.expected_stock:
        raise HTTPException(409, "Stock changed. Reload before saving.")
    for key, value in body.model_dump(exclude={"expected_stock"}).items():
        if (
            key
            in {
                "measurement_mode",
                "price_unit",
                "average_piece_weight_g",
                "quantity_step",
                "minimum_quantity",
            }
            and key not in body.model_fields_set
        ):
            continue
        setattr(product, key, value)
    product.updated_at = datetime.now(UTC)
    audit(session, user, "product.updated", identifier)
    await commit(session)
    return row(product)


@router.post("/inventory/{identifier}")
async def stock_edit(identifier: int, body: StockEdit, session: Session, user: Admin):
    product = await record(session, Product, identifier, lock=True)
    if product.stock_quantity != body.expected_stock:
        raise HTTPException(409, "Stock changed. Reload before saving.")
    product.stock_quantity = body.stock_quantity
    product.updated_at = datetime.now(UTC)
    audit(session, user, "inventory.updated", identifier)
    await commit(session)
    return row(product)


@router.get("/categories")
async def categories(
    session: Session,
    user: Admin,
    q: str = Query(default="", max_length=100),
    sort: str = Query(default="id", pattern="^(id|name)$"),
    page: int | None = Query(default=None, ge=1),
):
    conditions = [Category.name.ilike(f"%{q.replace('%', '').replace('_', '')}%")] if q else []
    return await resource_list(
        session, Category, conditions, Category.name if sort == "name" else Category.id, page
    )


@router.post("/categories", status_code=201)
async def category_create(body: CategoryEdit, session: Session, user: Admin):
    if body.parent_id:
        await record(session, Category, body.parent_id)
    category = Category(**body.model_dump())
    session.add(category)
    audit(session, user, "category.created", body.slug)
    await commit(session)
    return row(category)


@router.post("/categories/{identifier}")
async def category_edit(identifier: int, body: CategoryEdit, session: Session, user: Admin):
    # Serialize hierarchy changes to prevent concurrent parent cycles.
    await session.execute(text("SELECT pg_advisory_xact_lock(74101)"))
    category = await record(session, Category, identifier, lock=True)
    parent = body.parent_id
    visited = {identifier}
    while parent:
        if parent in visited:
            raise HTTPException(422, "Category hierarchy cycle")
        visited.add(parent)
        parent = (await record(session, Category, parent)).parent_id
    for key, value in body.model_dump().items():
        setattr(category, key, value)
    audit(session, user, "category.updated", identifier)
    await commit(session)
    return row(category)


@router.get("/orders")
async def orders(
    session: Session,
    user: Admin,
    page: int = Query(default=1, ge=1),
    q: str = Query(default="", max_length=100),
    status: str = Query(
        default="", pattern="^(|pending|confirmed|delivering|completed|cancelled)$"
    ),
    sort: str = Query(default="-created", pattern="^(-created|created|total|-total)$"),
):
    conditions = []
    if status:
        conditions.append(Order.status == status)
    if q:
        conditions.append(cast(Order.id, String).ilike(f"%{q.replace('%', '').replace('_', '')}%"))
    total = await session.scalar(select(func.count()).select_from(Order).where(*conditions))
    count = (
        select(func.count())
        .select_from(OrderItem)
        .where(OrderItem.order_id == Order.id)
        .correlate(Order)
        .scalar_subquery()
    )
    items = await session.execute(
        select(Order, count.label("item_count"))
        .where(*conditions)
        .order_by(
            {
                "-created": Order.created_at.desc(),
                "created": Order.created_at,
                "total": Order.total,
                "-total": Order.total.desc(),
            }[sort],
            Order.id,
        )
        .offset((page - 1) * 25)
        .limit(25)
    )
    result = []
    for order, count in items:
        result.append(
            {
                "id": order.id,
                "status": order.status,
                "total": order.total,
                "item_count": count,
                "created_at": order.created_at,
            }
        )
    return {"items": result, "total": total, "page": page, "page_size": 25}


@router.get("/orders/{identifier}")
async def order_detail(identifier: UUID, session: Session, user: Admin):
    order = await record(session, Order, identifier)
    return {
        **row(order, ("request_fingerprint", "idempotency_key")),
        "items": [
            row(i)
            for i in await session.scalars(
                select(OrderItem).where(OrderItem.order_id == identifier)
            )
        ],
    }


@router.get("/stores")
async def stores(
    session: Session,
    user: Admin,
    q: str = Query(default="", max_length=100),
    sort: str = Query(default="id", pattern="^(id|name)$"),
    page: int | None = Query(default=None, ge=1),
):
    pattern = f"%{q.replace('%', '').replace('_', '')}%"
    conditions = [Store.name.ilike(pattern) | Store.address.ilike(pattern)] if q else []
    return await resource_list(
        session, Store, conditions, Store.name if sort == "name" else Store.id, page
    )


@router.get("/stores/{identifier}")
async def store_detail(identifier: int, session: Session, user: Admin):
    return row(await record(session, Store, identifier))


@router.post("/stores/{identifier}")
async def store_edit(identifier: int, body: StoreEdit, session: Session, user: Admin):
    store = await record(session, Store, identifier, lock=True)
    for key, value in body.model_dump().items():
        setattr(store, key, value)
    audit(session, user, "store.updated", identifier)
    await commit(session)
    return row(store)


@router.get("/settings")
async def settings(request: Request, user: Admin):
    settings = request.app.state.settings
    return {
        "store_address": settings.store_address,
        "store_lat": settings.store_lat,
        "store_lon": settings.store_lon,
        "delivery_flat_price": settings.delivery_flat_price,
        "session_hours": settings.admin_session_hours,
        "routing_origin": "Environment-managed; directory edits do not change checkout origin.",
    }


@router.get("/master/administrators")
async def administrators(
    session: Session,
    user: Master,
    q: str = Query(default="", max_length=100),
    sort: str = Query(default="id", pattern="^(id|name)$"),
    page: int | None = Query(default=None, ge=1),
):
    pattern = f"%{q.replace('%', '').replace('_', '')}%"
    conditions = (
        [AdminUser.display_name.ilike(pattern) | AdminUser.email.ilike(pattern)] if q else []
    )
    return await resource_list(
        session,
        AdminUser,
        conditions,
        AdminUser.display_name if sort == "name" else AdminUser.id,
        page,
        user_public,
    )


@router.post("/master/administrators", status_code=201)
async def administrator_create(body: AdminCreate, session: Session, user: Master):
    await session.execute(text("SELECT pg_advisory_xact_lock(74102)"))
    account = AdminUser(
        **body.model_dump(exclude={"password"}),
        password_hash=await run_in_threadpool(hasher.hash, body.password),
    )
    session.add(account)
    audit(session, user, "administrator.created", body.email)
    await commit(session)
    return user_public(account)


@router.post("/master/administrators/{identifier}")
async def administrator_edit(identifier: int, body: AdminUpdate, session: Session, user: Master):
    await session.execute(text("SELECT pg_advisory_xact_lock(74102)"))
    account = await record(session, AdminUser, identifier, lock=True)
    if (
        account.role == "MASTER"
        and account.is_active
        and (body.role != "MASTER" or not body.is_active)
    ):
        count = await session.scalar(
            select(func.count())
            .select_from(AdminUser)
            .where(AdminUser.role == "MASTER", AdminUser.is_active.is_(True))
        )
        if count <= 1:
            raise HTTPException(409, "Cannot disable or demote the last active MASTER")
    for key, value in body.model_dump(exclude={"password"}).items():
        setattr(account, key, value)
    if body.password:
        account.password_hash = await run_in_threadpool(hasher.hash, body.password)
    account.updated_at = datetime.now(UTC)
    # Role changes, disabling and password changes invalidate existing sessions.
    await session.execute(delete(AdminSession).where(AdminSession.user_id == identifier))
    audit(session, user, "administrator.updated", identifier)
    await commit(session)
    return user_public(account)


@router.get("/master/audit")
async def audit_list(session: Session, user: Master):
    return [
        row(a)
        for a in await session.scalars(select(AdminAudit).order_by(AdminAudit.id.desc()).limit(100))
    ]


async def design_draft(session, user, config, action="design.draft"):
    await session.execute(text("SELECT pg_advisory_xact_lock(74103)"))
    version = (await session.scalar(select(func.max(DesignConfig.version))) or 0) + 1
    draft = DesignConfig(version=version, status="DRAFT", config=config, created_by=user.id)
    session.add(draft)
    audit(session, user, action, version)
    await commit(session)
    return row(draft)


@router.get("/master/design")
async def designs(session: Session, user: Master):
    values = await session.execute(
        select(DesignConfig, AdminUser.display_name)
        .join(AdminUser, AdminUser.id == DesignConfig.created_by)
        .order_by(DesignConfig.version.desc())
        .limit(100)
    )
    return [{**row(d), "author": author} for d, author in values]


@router.post("/master/design", status_code=201)
async def save_design(body: PaykarDesign, session: Session, user: Master):
    return await design_draft(session, user, body.model_dump())


@router.post("/master/design/{identifier}/publish")
async def publish_design(identifier: int, session: Session, user: Master):
    await session.execute(text("SELECT pg_advisory_xact_lock(74103)"))
    draft = await record(session, DesignConfig, identifier, lock=True)
    if draft.status != "DRAFT":
        raise HTTPException(409, "Only a saved draft can be published")
    PaykarDesign.model_validate(draft.config)
    await session.execute(
        update(DesignConfig).where(DesignConfig.status == "PUBLISHED").values(status="ARCHIVED")
    )
    draft.status = "PUBLISHED"
    draft.published_at = datetime.now(UTC)
    audit(session, user, "design.published", draft.version)
    await commit(session)
    return row(draft)


@router.post("/master/design/{identifier}/restore", status_code=201)
async def restore_design(identifier: int, session: Session, user: Master):
    original = await record(session, DesignConfig, identifier)
    if not original.published_at:
        raise HTTPException(409, "Select a previously published version")
    return await design_draft(
        session, user, PaykarDesign.model_validate(original.config).model_dump(), "design.restored"
    )


@public_router.get("/design/public")
async def public_design(response: Response, session: Session):
    config = await session.scalar(select(DesignConfig).where(DesignConfig.status == "PUBLISHED"))
    response.headers["Cache-Control"] = "no-store"
    return {
        "version": config.version if config else 0,
        "config": PaykarDesign.model_validate(config.config).model_dump()
        if config
        else PaykarDesign().model_dump(),
    }


@public_router.get("/stores")
async def public_stores(session: Session):
    return [
        row(s, ("is_active",))
        for s in await session.scalars(
            select(Store).where(Store.is_active.is_(True)).order_by(Store.id)
        )
    ]
