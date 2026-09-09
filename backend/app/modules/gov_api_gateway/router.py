"""Government API Gateway Router.

Exposes endpoints for government API integrations.
All endpoints return placeholder/mock data until actual API access is configured.
"""
from fastapi import APIRouter, Depends
from app.core.security import get_current_user
from app.modules.gov_api_gateway.service import gov_gateway
from app.modules.gov_api_gateway.config import gov_api_config

router = APIRouter(prefix="/gov-api", tags=["gov-api-gateway"])


@router.get("/status")
async def gateway_status(user=Depends(get_current_user)):
    """Check the status of all government API integrations."""
    return {
        "integrations": {
            "dilrmp": {"enabled": gov_api_config.dilrmp_enabled, "label": "DILRMP - Land Records"},
            "bhunaksha": {"enabled": gov_api_config.bhunaksha_enabled, "label": "Bhu-Naksha - Cadastral Maps"},
            "ulpin": {"enabled": gov_api_config.ulpin_enabled, "label": "ULPIN Validation"},
            "aadhaar_ekyc": {"enabled": gov_api_config.aadhaar_ekyc_enabled, "label": "Aadhaar eKYC"},
            "pfms": {"enabled": gov_api_config.pfms_enabled, "label": "PFMS - Compensation Tracking"},
            "sms_gateway": {"enabled": gov_api_config.sms_gateway_enabled, "label": "SMS Gateway (NIC/CDAC)"},
            "email_service": {"enabled": gov_api_config.email_service_enabled, "label": "Email Service"},
        },
        "_note": "All integrations are placeholders. Enable by configuring API keys in environment.",
    }


@router.get("/land-records/{ulpin}")
async def lookup_land_record(ulpin: str, user=Depends(get_current_user)):
    """Look up land record by ULPIN via DILRMP or mock."""
    return await gov_gateway.lookup_land_record(ulpin)


@router.get("/cadastral-map")
async def get_cadastral_map(
    state: str, district: str, village: str = "",
    user=Depends(get_current_user),
):
    """Fetch cadastral map data from Bhu-Naksha."""
    return await gov_gateway.get_cadastral_map(state, district, village)


@router.get("/validate-ulpin/{ulpin}")
async def validate_ulpin(ulpin: str, user=Depends(get_current_user)):
    """Validate ULPIN against national registry."""
    return await gov_gateway.validate_ulpin(ulpin)


@router.get("/compensation-status/{reference_id}")
async def track_compensation(reference_id: str, user=Depends(get_current_user)):
    """Track compensation payment via PFMS."""
    return await gov_gateway.track_compensation_payment(reference_id)
