from uuid import UUID

from fastapi import APIRouter

from app.core.database import Session
from app.schemas.order import OrderCreate, OrderOut
from app.services.delivery_service import Delivery
from app.services.order_service import create_order, get_order

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderOut, status_code=201)
async def create(body: OrderCreate, session: Session, delivery: Delivery):
    return await create_order(body, session, delivery)


@router.get("/{order_id}", response_model=OrderOut)
async def detail(order_id: UUID, session: Session):
    return await get_order(order_id, session)
