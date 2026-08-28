from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.core.database import get_db
from app.core.security import get_current_user
from app.modules.projects.schemas import ProjectCreate, ProjectResponse, ProjectListResponse, ProjectStatusUpdate
from app.modules.projects import service
from app.modules.auth.models import User

router = APIRouter(prefix="/projects", tags=["projects"])

@router.post("", response_model=ProjectResponse, status_code=201)
async def create_project(req: ProjectCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await service.create_project(db, req, current_user)

@router.get("", response_model=ProjectListResponse)
async def list_projects(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    projects = await service.list_projects(db, current_user)
    return {"projects": projects}

@router.get("/{id}", response_model=ProjectResponse)
async def get_project(id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await service.get_project(db, id, current_user)

@router.patch("/{id}/status", response_model=ProjectResponse)
async def update_project_status(id: UUID, req: ProjectStatusUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await service.update_project_status(db, id, req, current_user)
