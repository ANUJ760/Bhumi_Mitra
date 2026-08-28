from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from app.modules.auth.models import User, Agency
from app.modules.auth.schemas import LoginRequest, UserCreate
from app.core.security import verify_password, get_password_hash, create_access_token


async def authenticate_user(db: AsyncSession, req: LoginRequest):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User account is inactive")
    token = create_access_token(data={"sub": str(user.id)})
    return token


async def create_user(db: AsyncSession, req: UserCreate):
    result = await db.execute(select(User).where(User.email == req.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="User with this email address already exists")
    new_user = User(
        name=req.name,
        email=req.email,
        password_hash=get_password_hash(req.password),
        role=req.role,
        agency_id=req.agency_id,
        state_scope=req.state_scope,
        district_scope=req.district_scope,
        is_active=True
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user


async def register_user(db: AsyncSession, req: UserCreate):
    user = await create_user(db, req)
    token = create_access_token(data={"sub": str(user.id)})
    return {
        "user": user,
        "access_token": token,
        "token_type": "bearer"
    }


async def list_users(db: AsyncSession):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()


async def list_agencies(db: AsyncSession):
    result = await db.execute(select(Agency).order_by(Agency.name))
    return result.scalars().all()
