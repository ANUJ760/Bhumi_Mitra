from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_user
from app.modules.dashboard.schemas import DashboardSummary
from app.modules.dashboard import service
from app.modules.auth.models import User

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/summary", response_model=DashboardSummary)
async def get_summary(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await service.get_dashboard_summary(db, current_user)
