from pydantic import BaseModel, Field
from uuid import UUID
from typing import Optional, Any, List
from datetime import datetime
from app.modules.projects.models import ProjectStatus


class ProjectCreate(BaseModel):
    name: str
    project_type: str  # road, rail, irrigation, industrial, renewable, urban
    requiring_body_id: Optional[UUID] = None
    implementing_agency_id: Optional[UUID] = None
    state: str
    district: str
    budget: Optional[float] = None
    boundary_geojson: Optional[dict] = None  # GeoJSON Polygon
    geometry: Optional[dict] = None          # Alias for boundary_geojson


class ProjectResponse(BaseModel):
    id: UUID
    name: str
    project_type: str
    state: str
    district: str
    budget: Optional[float] = None
    status: ProjectStatus
    requiring_body_id: Optional[UUID] = None
    implementing_agency_id: Optional[UUID] = None
    created_by: Optional[UUID] = None
    created_at: datetime
    geometry: Optional[dict] = None

    class Config:
        from_attributes = True


class ProjectListResponse(BaseModel):
    projects: List[ProjectResponse]


class ProjectStatusUpdate(BaseModel):
    status: ProjectStatus
