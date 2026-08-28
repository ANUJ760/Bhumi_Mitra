import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from geoalchemy2 import Geometry
from app.core.database import Base

class ParcelStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"

class Parcel(Base):
    __tablename__ = "parcels"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ulpin = Column(String, unique=True, index=True, nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    geometry = Column(Geometry('POLYGON', srid=4326), nullable=True)
    area_hectares = Column(Float, nullable=False)
    overall_status = Column(SQLEnum(ParcelStatus), default=ParcelStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
