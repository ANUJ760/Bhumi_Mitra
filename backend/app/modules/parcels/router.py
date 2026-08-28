from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.core.database import get_db
from app.core.security import get_current_user
from app.modules.parcels.schemas import (
    ParcelCreate,
    ParcelResponse,
    ParcelDetailResponse,
    ParcelListResponse,
    ParcelCompletionResponse,
)
from app.modules.parcels import service
from app.modules.auth.models import User

router_projects = APIRouter(prefix="/projects", tags=["parcels"])
router_parcels = APIRouter(prefix="/parcels", tags=["parcels"])


@router_projects.post("/{id}/parcels", response_model=ParcelResponse, status_code=201)
async def create_parcel(
    id: UUID,
    req: ParcelCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await service.create_parcel(db, id, req, current_user)


@router_projects.get("/{id}/parcels", response_model=ParcelListResponse)
async def list_parcels(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    parcels = await service.list_parcels_for_project(db, id)
    return {"parcels": parcels}


@router_parcels.get("/{id}", response_model=ParcelDetailResponse)
async def get_parcel(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await service.get_parcel(db, id)


@router_parcels.get("/{id}/completion", response_model=ParcelCompletionResponse)
async def get_parcel_completion(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await service.get_parcel_completion_status(db, id)
