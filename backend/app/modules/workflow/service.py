from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from uuid import UUID
from datetime import datetime, timezone
from app.modules.workflow.models import (
    AcquisitionStage, StageName, StageStatus,
    Award, Compensation, PaymentStatus,
    RnrRecord, PossessionRecord, AffectedFamily,
)
from app.modules.parcels.models import Parcel
from app.modules.projects.models import Project, ProjectStatus
from app.modules.workflow.schemas import StageEventRequest
from app.modules.dashboard.service import log_event
from app.modules.parcels.service import get_parcel_completion_status
from app.modules.auth.models import RoleEnum


# RBAC mapping per stage per Section 4.5
STAGE_ALLOWED_ROLES = {
    StageName.NOTIFICATION: [RoleEnum.DISTRICT_AUTHORITY],
    StageName.AWARD: [RoleEnum.DISTRICT_AUTHORITY, RoleEnum.STATE_ADMIN],
    StageName.COMPENSATION: [RoleEnum.DISTRICT_AUTHORITY, RoleEnum.STATE_ADMIN],
    StageName.RNR: [RoleEnum.DISTRICT_AUTHORITY],
    StageName.POSSESSION: [RoleEnum.DISTRICT_AUTHORITY],
}


async def record_stage_event(
    db: AsyncSession,
    parcel_id: UUID,
    stage_name: StageName,
    event_data: StageEventRequest,
    user,
):
    # RBAC check per stage
    allowed = STAGE_ALLOWED_ROLES.get(stage_name, [])
    if user.role not in allowed and user.role != RoleEnum.CENTRAL_ADMIN:
        raise HTTPException(403, "Not enough permissions for this stage action")

    parcel = await db.get(Parcel, parcel_id)
    if not parcel:
        raise HTTPException(404, "Parcel not found")

    project = await db.get(Project, parcel.project_id)
    if project.status == ProjectStatus.REJECTED:
        raise HTTPException(409, "Cannot modify parcels of a rejected project")

    # Load all stages for this parcel
    result = await db.execute(
        select(AcquisitionStage).where(AcquisitionStage.parcel_id == parcel_id)
    )
    all_stages = {s.stage_name: s for s in result.scalars().all()}

    stage = all_stages.get(stage_name)
    if not stage:
        raise HTTPException(404, "Stage not found")

    now = datetime.now(timezone.utc)

    if stage_name == StageName.NOTIFICATION:
        if not event_data.notification_date or not event_data.document_id:
            raise HTTPException(400, "notification_date and document_id are required")
        stage.status = StageStatus.COMPLETED
        stage.evidence_document_id = event_data.document_id
        stage.started_at = stage.started_at or now
        stage.completed_at = now

    elif stage_name == StageName.AWARD:
        if all_stages[StageName.NOTIFICATION].status != StageStatus.COMPLETED:
            raise HTTPException(
                409, "Cannot record award before notification is complete"
            )
        if (
            not event_data.award_amount
            or not event_data.award_date
            or not event_data.authority
            or not event_data.document_id
        ):
            raise HTTPException(
                400, "award_amount, award_date, authority, and document_id are required"
            )
        award = Award(
            parcel_id=parcel_id,
            award_amount=event_data.award_amount,
            award_date=event_data.award_date,
            authority=event_data.authority,
        )
        db.add(award)
        stage.status = StageStatus.COMPLETED
        stage.evidence_document_id = event_data.document_id
        stage.started_at = stage.started_at or now
        stage.completed_at = now

    elif stage_name == StageName.COMPENSATION:
        if all_stages[StageName.AWARD].status != StageStatus.COMPLETED:
            raise HTTPException(
                409, "Cannot record compensation before award is complete"
            )
        if event_data.assessed_amount is None:
            raise HTTPException(400, "assessed_amount is required")
        comp = Compensation(
            parcel_id=parcel_id,
            assessed_amount=event_data.assessed_amount,
            approved_amount=event_data.approved_amount,
            disbursed_amount=event_data.disbursed_amount,
            disbursed_date=event_data.disbursed_date,
        )
        if event_data.payment_status:
            comp.payment_status = PaymentStatus(event_data.payment_status)
        db.add(comp)
        stage.started_at = stage.started_at or now
        # COMPLETED only when payment_status == DISBURSED
        if comp.payment_status == PaymentStatus.DISBURSED:
            stage.status = StageStatus.COMPLETED
            stage.completed_at = now
        else:
            stage.status = StageStatus.IN_PROGRESS

    elif stage_name == StageName.RNR:
        if all_stages[StageName.COMPENSATION].status != StageStatus.COMPLETED:
            raise HTTPException(
                409, "Cannot record R&R before compensation is complete"
            )
        stage.started_at = stage.started_at or now

        # Check if parcel has affected families
        fam_result = await db.execute(
            select(AffectedFamily).where(AffectedFamily.parcel_id == parcel_id)
        )
        families = fam_result.scalars().all()

        if len(families) == 0 and (event_data.affected_families_count is None or event_data.affected_families_count == 0):
            # No affected families — auto-resolve to NOT_APPLICABLE
            stage.status = StageStatus.NOT_APPLICABLE
            stage.completed_at = now
        else:
            rnr = RnrRecord(
                parcel_id=parcel_id,
                entitlement_confirmed=event_data.rnr_entitlement_confirmed or False,
                package_disbursed=event_data.rnr_package_disbursed or False,
            )
            db.add(rnr)
            # COMPLETED only when all families resettled AND package_disbursed
            all_resettled = all(f.resettled for f in families) if families else event_data.families_resettled
            if all_resettled and event_data.rnr_package_disbursed:
                stage.status = StageStatus.COMPLETED
                stage.completed_at = now
            else:
                stage.status = StageStatus.IN_PROGRESS

    elif stage_name == StageName.POSSESSION:
        rnr_status = all_stages[StageName.RNR].status
        comp_status = all_stages[StageName.COMPENSATION].status
        if rnr_status not in [StageStatus.COMPLETED, StageStatus.NOT_APPLICABLE]:
            raise HTTPException(
                409, "Cannot record possession before R&R is complete or not applicable"
            )
        if comp_status != StageStatus.COMPLETED:
            raise HTTPException(
                409, "Cannot record possession before compensation is complete"
            )
        if not event_data.possession_date or not event_data.document_id:
            raise HTTPException(400, "possession_date and document_id are required")
        poss = PossessionRecord(
            parcel_id=parcel_id,
            possession_date=event_data.possession_date,
            certificate_document_id=event_data.document_id,
        )
        db.add(poss)
        stage.status = StageStatus.COMPLETED
        stage.evidence_document_id = event_data.document_id
        stage.started_at = stage.started_at or now
        stage.completed_at = now

    stage.recorded_by = user.id
    await db.flush()

    # Recompute parcel overall_status per Section 8.1
    status_data = await get_parcel_completion_status(db, parcel_id)
    parcel.overall_status = status_data["overall_status"]

    await db.commit()
    await log_event(
        db, "STAGE", stage.id, f"STAGE_{stage_name.value}_UPDATED", user.id,
        new_value={"status": stage.status.value},
    )
    return stage
