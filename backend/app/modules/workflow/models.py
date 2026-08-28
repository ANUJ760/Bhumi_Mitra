import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Boolean, ForeignKey, Enum as SQLEnum, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base

class StageName(str, enum.Enum):
    NOTIFICATION = "NOTIFICATION"
    AWARD = "AWARD"
    COMPENSATION = "COMPENSATION"
    RNR = "RNR"
    POSSESSION = "POSSESSION"

class StageStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    NOT_APPLICABLE = "NOT_APPLICABLE"

class AcquisitionStage(Base):
    __tablename__ = "acquisition_stages"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    parcel_id = Column(UUID(as_uuid=True), ForeignKey("parcels.id"), nullable=False)
    stage_name = Column(SQLEnum(StageName), nullable=False)
    status = Column(SQLEnum(StageStatus), default=StageStatus.PENDING)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    evidence_document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=True)
    recorded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    __table_args__ = (UniqueConstraint('parcel_id', 'stage_name', name='uix_parcel_stage'),)

class Award(Base):
    __tablename__ = "awards"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    parcel_id = Column(UUID(as_uuid=True), ForeignKey("parcels.id"), unique=True, nullable=False)
    award_amount = Column(Float, nullable=False)
    award_date = Column(DateTime, nullable=False)
    authority = Column(String, nullable=False)

class PaymentStatus(str, enum.Enum):
    ASSESSED = "ASSESSED"
    APPROVED = "APPROVED"
    DISBURSED = "DISBURSED"

class Compensation(Base):
    __tablename__ = "compensation"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    parcel_id = Column(UUID(as_uuid=True), ForeignKey("parcels.id"), unique=True, nullable=False)
    assessed_amount = Column(Float, nullable=False)
    approved_amount = Column(Float, nullable=True)
    disbursed_amount = Column(Float, nullable=True)
    disbursed_date = Column(DateTime, nullable=True)
    payment_status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.ASSESSED)

class AffectedFamily(Base):
    __tablename__ = "affected_families"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    parcel_id = Column(UUID(as_uuid=True), ForeignKey("parcels.id"), nullable=False)
    household_ref = Column(String, nullable=False)
    displaced = Column(Boolean, default=False)
    resettled = Column(Boolean, default=False)

class RnrRecord(Base):
    __tablename__ = "rnr_records"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    parcel_id = Column(UUID(as_uuid=True), ForeignKey("parcels.id"), unique=True, nullable=False)
    entitlement_confirmed = Column(Boolean, default=False)
    package_disbursed = Column(Boolean, default=False)
    completed_date = Column(DateTime, nullable=True)

class PossessionRecord(Base):
    __tablename__ = "possession_records"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    parcel_id = Column(UUID(as_uuid=True), ForeignKey("parcels.id"), unique=True, nullable=False)
    possession_date = Column(DateTime, nullable=False)
    certificate_document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=True)
