from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import date, datetime


class StageEventRequest(BaseModel):
    """Unified request for all stage events. Only the fields relevant to the
    target stage are required — the service layer validates per stage."""

    # NOTIFICATION
    notification_date: Optional[date] = None

    # Shared: evidence document
    document_id: Optional[UUID] = None

    # AWARD
    award_amount: Optional[float] = None
    award_date: Optional[date] = None
    authority: Optional[str] = None

    # COMPENSATION
    assessed_amount: Optional[float] = None
    approved_amount: Optional[float] = None
    disbursed_amount: Optional[float] = None
    disbursed_date: Optional[date] = None
    payment_status: Optional[str] = None  # ASSESSED | APPROVED | DISBURSED

    # RNR
    affected_families_count: Optional[int] = None
    families_resettled: Optional[bool] = False
    rnr_entitlement_confirmed: Optional[bool] = False
    rnr_package_disbursed: Optional[bool] = False

    # POSSESSION
    possession_date: Optional[date] = None


class StageEventResponse(BaseModel):
    id: UUID
    stage_name: str
    status: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True
