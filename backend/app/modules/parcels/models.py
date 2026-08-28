import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base, PolygonGeometry

class ParcelStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"

class Parcel(Base):
    __tablename__ = "parcels"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ulpin = Column(String, unique=True, index=True, nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    geometry = Column(PolygonGeometry, nullable=True)
    area_hectares = Column(Float, nullable=False)
    overall_status = Column(SQLEnum(ParcelStatus), default=ParcelStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
