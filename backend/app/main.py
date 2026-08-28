from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import engine, Base, async_session_maker
from app.modules.auth.models import User, RoleEnum, Agency
from app.core.security import get_password_hash
from sqlalchemy import select
import os

from app.modules.auth.router import router as auth_router, users_router
from app.modules.projects.router import router as projects_router
from app.modules.parcels.router import router_projects as parcels_proj_router, router_parcels as parcels_router
from app.modules.workflow.router import router as workflow_router
from app.modules.documents.router import router as documents_router
from app.modules.dashboard.router import router as dashboard_router
from app.modules.mock_gov_api.router import router as mock_gov_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Auto-seed initial admin and agencies if empty
    async with async_session_maker() as db:
        res = await db.execute(select(User).where(User.email == "admin@bhumimitra.gov.in"))
        admin = res.scalar_one_or_none()
        if not admin:
            admin = User(
                name="Central Administrator",
                email="admin@bhumimitra.gov.in",
                password_hash=get_password_hash("Admin@123456"),
                role=RoleEnum.CENTRAL_ADMIN,
                is_active=True,
            )
            db.add(admin)
            print("Seeded Central Admin -> admin@bhumimitra.gov.in / Admin@123456")

        # Seed Agencies
        sample_agencies = [
            ("Ministry of Road Transport & Highways (MoRTH)", "ministry", None),
            ("Maharashtra Public Works Department (PWD)", "state_dept", "Maharashtra"),
            ("Pune District Collector Office", "district_office", "Maharashtra"),
            ("National Highways Authority of India (NHAI)", "implementing_agency", None),
            ("Dedicated Freight Corridor Corporation (DFCCIL)", "implementing_agency", None),
        ]
        for name, atype, astate in sample_agencies:
            ag_res = await db.execute(select(Agency).where(Agency.name == name))
            if not ag_res.scalar_one_or_none():
                db.add(Agency(name=name, type=atype, state=astate))

        await db.commit()

    yield
    await engine.dispose()


app = FastAPI(title="Bhumi Mitra MVP API", version="1.0.0", lifespan=lifespan)

# Allow CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*", settings.FRONTEND_ORIGIN, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploaded documents
upload_dir = os.path.join(os.getcwd(), "uploaded_documents")
os.makedirs(upload_dir, exist_ok=True)
app.mount("/uploaded_documents", StaticFiles(directory=upload_dir), name="uploaded_documents")

app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(projects_router, prefix="/api/v1")
app.include_router(parcels_proj_router, prefix="/api/v1")
app.include_router(parcels_router, prefix="/api/v1")
app.include_router(workflow_router, prefix="/api/v1")
app.include_router(documents_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")
app.include_router(mock_gov_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    return {"status": "ok", "app": "Bhumi Mitra MVP"}
