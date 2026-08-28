import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from geoalchemy2 import Geometry
from app.core.database import Base

class ProjectStatus(str, enum.Enum):
    PROPOSED = "PROPOSED"
    APPROVED = "APPROVED"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    REJECTED = "REJECTED"

class Project(Base):
    __tablename__ = "projects"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    project_type = Column(String, nullable=False)
    requiring_body_id = Column(UUID(as_uuid=True), ForeignKey("agencies.id"), nullable=True)
    implementing_agency_id = Column(UUID(as_uuid=True), ForeignKey("agencies.id"), nullable=True)
    state = Column(String, nullable=False)
    district = Column(String, nullable=False)
    boundary_geometry = Column(Geometry('POLYGON', srid=4326), nullable=True)
    budget = Column(Float, nullable=True)
    status = Column(SQLEnum(ProjectStatus), default=ProjectStatus.PROPOSED)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
