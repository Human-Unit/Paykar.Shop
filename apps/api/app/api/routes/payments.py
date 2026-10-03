from uuid import UUID

from fastapi import APIRouter

from app.core.database import Session
from app.payments import service
from app.payments.schemas import Confirm, Confirmation, PaymentOut, SessionCreate
from app.services.delivery_service import Delivery

router = APIRouter(prefix="/payments", tags=["sandbox payments"])


@router.post("/sandbox/session", response_model=PaymentOut, status_code=201)
async def create(body: SessionCreate, session: Session, delivery: Delivery):
    return await service.create_session(body, session, delivery)


@router.post("/sandbox/confirm", response_model=Confirmation)
async def confirm(body: Confirm, session: Session, delivery: Delivery):
    return await service.confirm(body, session, delivery)


@router.get("/{payment_id}", response_model=PaymentOut)
async def detail(payment_id: UUID, session: Session):
    return await service.detail(payment_id, session)
