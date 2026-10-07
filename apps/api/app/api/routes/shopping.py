from fastapi import APIRouter, HTTPException

from app.core.database import Session
from app.schemas.shopping import CuratedTemplate, ShoppingPreview, ShoppingPreviewIn
from app.services.shopping_service import curated_templates, preview_items

router = APIRouter(prefix="/shopping", tags=["shopping"])


@router.post("/preview", response_model=ShoppingPreview)
async def preview(body: ShoppingPreviewIn, session: Session):
    return await preview_items(body.items, session)


@router.get("/templates", response_model=list[CuratedTemplate])
async def templates(session: Session):
    return await curated_templates(session)


@router.get("/templates/{template_id}", response_model=CuratedTemplate)
async def template(template_id: str, session: Session):
    for row in await curated_templates(session):
        if row.id == template_id:
            return row
    raise HTTPException(404, "Shopping template not found")
