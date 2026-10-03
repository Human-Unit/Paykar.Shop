from fastapi import APIRouter

from app.api.routes import categories, delivery, health, orders, payments, products

router = APIRouter(prefix="/api/v1")
router.include_router(health.router)
router.include_router(categories.router)
router.include_router(products.router)
router.include_router(delivery.router)
router.include_router(orders.router)
router.include_router(payments.router)
