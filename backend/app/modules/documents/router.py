from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.core.database import get_db
from app.core.security import get_current_user
from app.modules.documents.schemas import DocumentResponse, DocumentListResponse
from app.modules.documents import service
from app.modules.auth.models import User, RoleEnum

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("", response_model=DocumentResponse, status_code=201)
async def upload_doc(
    file: UploadFile = File(...),
    related_entity_type: str = Form(...),
    related_entity_id: UUID = Form(...),
    doc_type: str = Form(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # RBAC: only DISTRICT_AUTHORITY, PROJECT_AGENCY, FIELD_OFFICER can upload
    if current_user.role not in [
        RoleEnum.DISTRICT_AUTHORITY,
        RoleEnum.PROJECT_AGENCY,
        RoleEnum.FIELD_OFFICER,
        RoleEnum.CENTRAL_ADMIN,
    ]:
        raise HTTPException(403, "Not enough permissions")
    return await service.upload_document(
        db, file, related_entity_type, related_entity_id, doc_type, current_user
    )


@router.get("", response_model=DocumentListResponse)
async def list_docs(
    related_entity_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    docs = await service.list_documents(db, related_entity_id)
    return {"documents": docs}
