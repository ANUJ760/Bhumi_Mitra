from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from app.modules.projects.models import Project, ProjectStatus
from app.modules.projects.schemas import ProjectCreate, ProjectStatusUpdate, ProjectResponse
from app.modules.auth.models import RoleEnum
from app.modules.dashboard.service import log_event
from geoalchemy2.shape import from_shape, to_shape
from shapely.geometry import shape, mapping
from uuid import UUID


def _geom_to_dict(geom):
    if geom is None:
        return None
    try:
        s = to_shape(geom)
        return mapping(s)
    except Exception:
        return None


def _to_project_response(p: Project) -> ProjectResponse:
    return ProjectResponse(
        id=p.id,
        name=p.name,
        project_type=p.project_type,
        state=p.state,
        district=p.district,
        budget=p.budget,
        status=p.status,
        requiring_body_id=p.requiring_body_id,
        implementing_agency_id=p.implementing_agency_id,
        created_by=p.created_by,
        created_at=p.created_at,
        geometry=_geom_to_dict(p.boundary_geometry),
    )


async def create_project(db: AsyncSession, req: ProjectCreate, user):
    # RBAC: only PROJECT_AGENCY and CENTRAL_ADMIN can create projects
    if user.role not in [RoleEnum.PROJECT_AGENCY, RoleEnum.CENTRAL_ADMIN]:
        raise HTTPException(403, "Not enough permissions")

    project = Project(
        name=req.name,
        project_type=req.project_type,
        requiring_body_id=req.requiring_body_id,
        implementing_agency_id=req.implementing_agency_id,
        state=req.state,
        district=req.district,
        budget=req.budget,
        created_by=user.id,
    )

    geojson = req.boundary_geojson or req.geometry
    if geojson:
        try:
            geom = shape(geojson)
            project.boundary_geometry = from_shape(geom, srid=4326)
        except Exception:
            raise HTTPException(400, "Invalid GeoJSON boundary geometry")

    db.add(project)
    await db.commit()
    await db.refresh(project)
    await log_event(db, "PROJECT", project.id, "CREATED", user.id)
    return _to_project_response(project)


async def list_projects(db: AsyncSession, user):
    stmt = select(Project)

    if user.role == RoleEnum.STATE_ADMIN:
        stmt = stmt.where(Project.state == user.state_scope)
    elif user.role == RoleEnum.DISTRICT_AUTHORITY:
        stmt = stmt.where(
            (Project.state == user.state_scope) & (Project.district == user.district_scope)
        )
    elif user.role == RoleEnum.PROJECT_AGENCY:
        stmt = stmt.where(
            (Project.implementing_agency_id == user.agency_id) | (Project.created_by == user.id)
        )
    elif user.role == RoleEnum.VIEWER:
        if user.state_scope:
            stmt = stmt.where(Project.state == user.state_scope)
            if user.district_scope:
                stmt = stmt.where(Project.district == user.district_scope)
    # CENTRAL_ADMIN, AUDITOR: no filter — see all

    result = await db.execute(stmt.order_by(Project.created_at.desc()))
    projects = result.scalars().all()
    return [_to_project_response(p) for p in projects]


async def get_project(db: AsyncSession, project_id: UUID, user):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    return _to_project_response(project)


async def update_project_status(db: AsyncSession, project_id: UUID, req: ProjectStatusUpdate, user):
    # RBAC: only CENTRAL_ADMIN and STATE_ADMIN can approve/reject
    if user.role not in [RoleEnum.CENTRAL_ADMIN, RoleEnum.STATE_ADMIN]:
        raise HTTPException(403, "Not enough permissions")

    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(404, "Project not found")

    old_status = project.status.value
    project.status = req.status

    await db.commit()
    await db.refresh(project)
    await log_event(
        db, "PROJECT", project.id, "STATUS_CHANGED", user.id,
        old_value={"status": old_status},
        new_value={"status": project.status.value},
    )
    return _to_project_response(project)
