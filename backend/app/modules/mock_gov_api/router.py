from fastapi import APIRouter, HTTPException
from app.modules.mock_gov_api import service

router = APIRouter(prefix="/mock-gov", tags=["mock-gov"])

@router.get("/land-records")
async def get_land_record(ulpin: str):
    # MOCK — replace with real DILRMP/Bhu-Naksha/ULPIN integration in production
    rec = await service.lookup_land_record(ulpin)
    if not rec:
        raise HTTPException(404, "Land record not found")
    return rec
