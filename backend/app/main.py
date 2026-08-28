from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

from app.modules.auth.router import router as auth_router, users_router
from app.modules.projects.router import router as projects_router
from app.modules.parcels.router import router_projects as parcels_proj_router, router_parcels as parcels_router
from app.modules.workflow.router import router as workflow_router
from app.modules.documents.router import router as documents_router
from app.modules.dashboard.router import router as dashboard_router
from app.modules.mock_gov_api.router import router as mock_gov_router

app = FastAPI(title="Bhumi Mitra MVP")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    return {"status": "ok"}
