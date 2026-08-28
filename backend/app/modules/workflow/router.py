from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.core.database import get_db
from app.core.security import get_current_user
from app.modules.workflow.schemas import StageEventRequest
from app.modules.workflow import service
from app.modules.workflow.models import StageName
from app.modules.auth.models import User

router = APIRouter(prefix="/parcels", tags=["workflow"])

@router.post("/{id}/stages/{stage_name}")
async def record_stage(id: UUID, stage_name: StageName, req: StageEventRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stage = await service.record_stage_event(db, id, stage_name, req, current_user)
    return {"status": stage.status}
