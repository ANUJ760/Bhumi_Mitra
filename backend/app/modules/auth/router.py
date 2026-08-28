from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.modules.auth.schemas import (
    LoginRequest,
    LoginResponse,
    UserCreate,
    UserResponse,
    UserListResponse,
    AgencyResponse,
)
from app.modules.auth import service
from app.modules.auth.models import User, RoleEnum

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    token = await service.authenticate_user(db, req)
    return {"access_token": token}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


users_router = APIRouter(tags=["users", "agencies"])


@users_router.post("/users", response_model=UserResponse, status_code=201)
async def create_user(
    req: UserCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_roles(RoleEnum.CENTRAL_ADMIN)),
):
    return await service.create_user(db, req)


@users_router.get("/users", response_model=UserListResponse)
async def list_users(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_roles(RoleEnum.CENTRAL_ADMIN)),
):
    users = await service.list_users(db)
    return {"users": users}


@users_router.get("/agencies", response_model=List[AgencyResponse])
async def list_agencies(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await service.list_agencies(db)
