from pydantic import BaseModel
from uuid import UUID
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.modules.parcels.models import ParcelStatus
from app.modules.workflow.models import StageName, StageStatus


class ParcelCreate(BaseModel):
    ulpin: str
    area_hectares: float
    geometry: Optional[dict] = None  # GeoJSON Polygon


class StageResponse(BaseModel):
    id: UUID
    parcel_id: UUID
    stage_name: StageName
    status: StageStatus
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    evidence_document_id: Optional[UUID] = None
    recorded_by: Optional[UUID] = None

    class Config:
        from_attributes = True


class ParcelResponse(BaseModel):
    id: UUID
    ulpin: str
    project_id: UUID
    area_hectares: float
    overall_status: ParcelStatus
    created_at: datetime
    geometry: Optional[dict] = None

    class Config:
        from_attributes = True


class ParcelDetailResponse(BaseModel):
    id: UUID
    ulpin: str
    project_id: UUID
    area_hectares: float
    overall_status: ParcelStatus
    created_at: datetime
    geometry: Optional[dict] = None
    stages: List[StageResponse] = []

    class Config:
        from_attributes = True


class ParcelListResponse(BaseModel):
    parcels: List[ParcelResponse]


class ParcelCompletionResponse(BaseModel):
    overall_status: ParcelStatus
    stage_statuses: Dict[str, str]
