from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.modules.projects.models import Project, ProjectStatus
from app.modules.parcels.models import Parcel, ParcelStatus
from app.modules.auth.models import RoleEnum


async def get_dashboard_summary(db: AsyncSession, user) -> dict:
    """
    Returns dashboard summary scoped by the caller's role:
    - CENTRAL_ADMIN, AUDITOR: see all data
    - STATE_ADMIN: own state only
    - DISTRICT_AUTHORITY: own district only
    - Others: scoped by their state/district
    Returns valid zeroed counts on empty database (Section 8.3).
    """
    # Base query filters
    project_filter = select(Project)
    parcel_filter = select(Parcel)

    if user.role == RoleEnum.STATE_ADMIN and user.state_scope:
        project_filter = project_filter.where(Project.state == user.state_scope)
        parcel_filter = parcel_filter.join(Project).where(Project.state == user.state_scope)
    elif user.role == RoleEnum.DISTRICT_AUTHORITY and user.state_scope:
        project_filter = project_filter.where(
            (Project.state == user.state_scope) & (Project.district == user.district_scope)
        )
        parcel_filter = parcel_filter.join(Project).where(
            (Project.state == user.state_scope) & (Project.district == user.district_scope)
        )
    elif user.role == RoleEnum.VIEWER:
        if user.state_scope:
            project_filter = project_filter.where(Project.state == user.state_scope)
            parcel_filter = parcel_filter.join(Project).where(Project.state == user.state_scope)
            if user.district_scope:
                project_filter = project_filter.where(Project.district == user.district_scope)
                parcel_filter = parcel_filter.where(Project.district == user.district_scope)
    elif user.role == RoleEnum.PROJECT_AGENCY:
        project_filter = project_filter.where(
            (Project.implementing_agency_id == user.agency_id) | (Project.created_by == user.id)
        )
        # Parcels for those projects
        subq = project_filter.with_only_columns(Project.id).subquery()
        parcel_filter = parcel_filter.where(Parcel.project_id.in_(select(subq.c.id)))

    # Total projects
    total_proj = await db.execute(
        select(func.count()).select_from(project_filter.subquery())
    )

    # Projects by status
    proj_by_status = {}
    for status in ProjectStatus:
        count_result = await db.execute(
            select(func.count()).select_from(
                project_filter.where(Project.status == status).subquery()
            )
        )
        proj_by_status[status.value] = count_result.scalar() or 0

    # Total parcels
    total_parc = await db.execute(
        select(func.count()).select_from(parcel_filter.subquery())
    )

    # Parcels by status
    parc_by_status = {}
    for status in ParcelStatus:
        count_result = await db.execute(
            select(func.count()).select_from(
                parcel_filter.where(Parcel.overall_status == status).subquery()
            )
        )
        parc_by_status[status.value] = count_result.scalar() or 0

    return {
        "total_projects": total_proj.scalar() or 0,
        "total_parcels": total_parc.scalar() or 0,
        "projects_by_status": proj_by_status,
        "parcels_by_status": parc_by_status,
    }


async def log_event(
    db: AsyncSession,
    entity_type: str,
    entity_id,
    action: str,
    actor_id,
    old_value=None,
    new_value=None,
):
    from app.modules.dashboard.models import AuditLog

    log = AuditLog(
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        actor_id=actor_id,
        old_value=old_value,
        new_value=new_value,
    )
    db.add(log)
    await db.commit()
