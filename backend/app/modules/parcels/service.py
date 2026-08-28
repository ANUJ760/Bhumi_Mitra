from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from app.modules.parcels.models import Parcel, ParcelStatus
from app.modules.parcels.schemas import ParcelCreate, ParcelResponse, ParcelDetailResponse, StageResponse
from app.modules.projects.models import Project, ProjectStatus
from app.modules.workflow.models import AcquisitionStage, StageName, StageStatus, Compensation, PaymentStatus
from app.modules.dashboard.service import log_event
from app.modules.auth.models import RoleEnum
from uuid import UUID
from geoalchemy2.shape import from_shape, to_shape
from shapely.geometry import shape, mapping


def _geom_to_dict(geom):
    if geom is None:
        return None
    try:
        s = to_shape(geom)
        return mapping(s)
    except Exception:
        return None


async def create_parcel(db: AsyncSession, project_id: UUID, req: ParcelCreate, user):
    if user.role not in [RoleEnum.DISTRICT_AUTHORITY, RoleEnum.CENTRAL_ADMIN]:
        raise HTTPException(403, "Not enough permissions")

    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    if project.status not in [ProjectStatus.APPROVED, ProjectStatus.ACTIVE]:
        raise HTTPException(409, "Project must be APPROVED or ACTIVE to add parcels")

    result = await db.execute(select(Parcel).where(Parcel.ulpin == req.ulpin))
    if result.scalar_one_or_none():
        raise HTTPException(409, "Parcel with this ULPIN already exists in the system")

    parcel = Parcel(
        ulpin=req.ulpin,
        project_id=project_id,
        area_hectares=req.area_hectares,
    )

    if req.geometry:
        try:
            geom = shape(req.geometry)
            parcel.geometry = from_shape(geom, srid=4326)

            # Check if parcel geometry is within project boundary (log warning if not)
            if project.boundary_geometry:
                proj_geom = to_shape(project.boundary_geometry)
                if not proj_geom.contains(geom):
                    await log_event(
                        db, "PARCEL", None,
                        "parcel_outside_boundary_warning",
                        user.id,
                        new_value={"ulpin": req.ulpin, "project_id": str(project_id)}
                    )
        except Exception:
            raise HTTPException(400, "Invalid GeoJSON geometry")

    db.add(parcel)
    await db.flush()

    # Create all 5 acquisition stages with PENDING status
    for s_name in StageName:
        stage = AcquisitionStage(
            parcel_id=parcel.id,
            stage_name=s_name,
            status=StageStatus.PENDING,
        )
        db.add(stage)

    await db.commit()
    await db.refresh(parcel)
    await log_event(db, "PARCEL", parcel.id, "CREATED", user.id)

    return ParcelResponse(
        id=parcel.id,
        ulpin=parcel.ulpin,
        project_id=parcel.project_id,
        area_hectares=parcel.area_hectares,
        overall_status=parcel.overall_status,
        created_at=parcel.created_at,
        geometry=_geom_to_dict(parcel.geometry),
    )


async def list_parcels_for_project(db: AsyncSession, project_id: UUID):
    result = await db.execute(
        select(Parcel).where(Parcel.project_id == project_id).order_by(Parcel.created_at)
    )
    parcels = result.scalars().all()
    return [
        ParcelResponse(
            id=p.id,
            ulpin=p.ulpin,
            project_id=p.project_id,
            area_hectares=p.area_hectares,
            overall_status=p.overall_status,
            created_at=p.created_at,
            geometry=_geom_to_dict(p.geometry),
        )
        for p in parcels
    ]


async def get_parcel(db: AsyncSession, parcel_id: UUID):
    parcel = await db.get(Parcel, parcel_id)
    if not parcel:
        raise HTTPException(404, "Parcel not found")

    stages_res = await db.execute(
        select(AcquisitionStage).where(AcquisitionStage.parcel_id == parcel_id)
    )
    stages = stages_res.scalars().all()

    # Order stages: NOTIFICATION, AWARD, COMPENSATION, RNR, POSSESSION
    order = {s: i for i, s in enumerate(StageName)}
    stages_sorted = sorted(stages, key=lambda x: order.get(x.stage_name, 99))

    return ParcelDetailResponse(
        id=parcel.id,
        ulpin=parcel.ulpin,
        project_id=parcel.project_id,
        area_hectares=parcel.area_hectares,
        overall_status=parcel.overall_status,
        created_at=parcel.created_at,
        geometry=_geom_to_dict(parcel.geometry),
        stages=[
            StageResponse(
                id=s.id,
                parcel_id=s.parcel_id,
                stage_name=s.stage_name,
                status=s.status,
                started_at=s.started_at,
                completed_at=s.completed_at,
                evidence_document_id=s.evidence_document_id,
                recorded_by=s.recorded_by,
            )
            for s in stages_sorted
        ],
    )


async def get_parcel_completion_status(db: AsyncSession, parcel_id: UUID) -> dict:
    """
    Compute parcel overall_status per Section 8.1:

    COMPLETED IFF:
      - NOTIFICATION.status == COMPLETED
      AND AWARD.status == COMPLETED
      AND COMPENSATION.status == COMPLETED
        AND compensation.payment_status == DISBURSED
      AND (RNR.status == COMPLETED OR RNR.status == NOT_APPLICABLE)
      AND POSSESSION.status == COMPLETED

    Otherwise IN_PROGRESS if any stage has moved past PENDING, else PENDING.
    """
    result = await db.execute(
        select(AcquisitionStage).where(AcquisitionStage.parcel_id == parcel_id)
    )
    stages = result.scalars().all()
    stage_map = {s.stage_name: s.status for s in stages}

    if not stage_map:
        return {"overall_status": ParcelStatus.PENDING, "stage_statuses": {}}

    # Check full completion rule
    notification_done = stage_map.get(StageName.NOTIFICATION) == StageStatus.COMPLETED
    award_done = stage_map.get(StageName.AWARD) == StageStatus.COMPLETED
    compensation_done = stage_map.get(StageName.COMPENSATION) == StageStatus.COMPLETED
    rnr_resolved = stage_map.get(StageName.RNR) in [StageStatus.COMPLETED, StageStatus.NOT_APPLICABLE]
    possession_done = stage_map.get(StageName.POSSESSION) == StageStatus.COMPLETED

    # Additionally verify compensation payment_status is DISBURSED
    comp_disbursed = False
    if compensation_done:
        comp_result = await db.execute(
            select(Compensation).where(Compensation.parcel_id == parcel_id)
        )
        comp = comp_result.scalar_one_or_none()
        comp_disbursed = comp is not None and comp.payment_status == PaymentStatus.DISBURSED

    if (notification_done and award_done and compensation_done and
            comp_disbursed and rnr_resolved and possession_done):
        overall = ParcelStatus.COMPLETED
    elif any(s != StageStatus.PENDING for s in stage_map.values()):
        overall = ParcelStatus.IN_PROGRESS
    else:
        overall = ParcelStatus.PENDING

    return {
        "overall_status": overall,
        "stage_statuses": {s.value: stage_map.get(s, StageStatus.PENDING).value for s in StageName}
    }
