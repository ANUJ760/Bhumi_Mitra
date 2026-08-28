import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base

class RoleEnum(str, enum.Enum):
    CENTRAL_ADMIN = "CENTRAL_ADMIN"
    STATE_ADMIN = "STATE_ADMIN"
    DISTRICT_AUTHORITY = "DISTRICT_AUTHORITY"
    PROJECT_AGENCY = "PROJECT_AGENCY"
    FIELD_OFFICER = "FIELD_OFFICER"
    AUDITOR = "AUDITOR"
    VIEWER = "VIEWER"

class Agency(Base):
    __tablename__ = "agencies"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    state = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(SQLEnum(RoleEnum), nullable=False)
    agency_id = Column(UUID(as_uuid=True), ForeignKey("agencies.id"), nullable=True)
    state_scope = Column(String, nullable=True)
    district_scope = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
