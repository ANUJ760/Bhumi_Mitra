"""Government API Gateway Service.

Placeholder service layer for government API integrations.
Each method returns mock/placeholder data when the corresponding API is not configured.
When government API access is granted, implement the actual HTTP calls here.

All methods follow a consistent pattern:
1. Check if the integration is enabled
2. If enabled, make the actual API call
3. If not enabled, return placeholder/mock data with a flag indicating it's mock data
"""
from typing import Optional, Dict, Any
from app.modules.gov_api_gateway.config import gov_api_config
import logging

logger = logging.getLogger(__name__)


class GovAPIGateway:
    """Unified gateway for all government API integrations."""

    # ─── DILRMP: Land Records ────────────────────────────────────────

    @staticmethod
    async def lookup_land_record(ulpin: str) -> Dict[str, Any]:
        """
        Look up a land record by ULPIN from DILRMP.
        Falls back to local mock data if DILRMP is not configured.
        """
        if gov_api_config.dilrmp_enabled and gov_api_config.dilrmp_base_url:
            # TODO: Implement actual DILRMP API call
            # url = f"{gov_api_config.dilrmp_base_url}/api/v1/land-records/{ulpin}"
            # headers = {"Authorization": f"Bearer {gov_api_config.dilrmp_api_key}"}
            # async with httpx.AsyncClient() as client:
            #     response = await client.get(url, headers=headers)
            #     return response.json()
            logger.info(f"DILRMP API call placeholder for ULPIN: {ulpin}")
            pass

        # Fallback to mock
        from app.modules.mock_gov_api.service import lookup_land_record
        result = await lookup_land_record(ulpin)
        if result:
            result["_source"] = "MOCK"
            result["_note"] = "Using mock data. Connect DILRMP API for production."
        return result

    # ─── Bhu-Naksha: Cadastral Maps ──────────────────────────────────

    @staticmethod
    async def get_cadastral_map(state: str, district: str, village: str) -> Dict[str, Any]:
        """
        Fetch cadastral map data from Bhu-Naksha service.
        Placeholder — returns a stub response.
        """
        if gov_api_config.bhunaksha_enabled and gov_api_config.bhunaksha_base_url:
            # TODO: Implement actual Bhu-Naksha API call
            logger.info(f"Bhu-Naksha API call placeholder: {state}/{district}/{village}")
            pass

        return {
            "_source": "PLACEHOLDER",
            "_note": "Bhu-Naksha integration pending. Connect API for cadastral map overlays.",
            "state": state,
            "district": district,
            "village": village,
            "map_url": None,
            "parcels": [],
        }

    # ─── ULPIN Validation ────────────────────────────────────────────

    @staticmethod
    async def validate_ulpin(ulpin: str) -> Dict[str, Any]:
        """
        Validate a ULPIN against the national registry.
        Placeholder — always returns valid for mock ULPINs.
        """
        if gov_api_config.ulpin_enabled and gov_api_config.ulpin_base_url:
            # TODO: Implement actual ULPIN validation API call
            logger.info(f"ULPIN validation API call placeholder: {ulpin}")
            pass

        return {
            "_source": "PLACEHOLDER",
            "ulpin": ulpin,
            "valid": ulpin.startswith("ULPIN-"),
            "_note": "ULPIN validation is using pattern matching. Connect ULPIN API for real validation.",
        }

    # ─── Aadhaar eKYC ────────────────────────────────────────────────

    @staticmethod
    async def verify_aadhaar(aadhaar_number: str) -> Dict[str, Any]:
        """
        Verify Aadhaar identity for stakeholder authentication.
        Placeholder — not functional without UIDAI API access.
        """
        return {
            "_source": "PLACEHOLDER",
            "_note": "Aadhaar eKYC requires UIDAI API access. Not available in prototype.",
            "verified": False,
            "aadhaar_number": aadhaar_number[:4] + "****" + aadhaar_number[-4:] if len(aadhaar_number) == 12 else "INVALID",
        }

    # ─── PFMS: Compensation Tracking ─────────────────────────────────

    @staticmethod
    async def track_compensation_payment(reference_id: str) -> Dict[str, Any]:
        """
        Track compensation payment status via PFMS.
        Placeholder — returns stub data.
        """
        if gov_api_config.pfms_enabled and gov_api_config.pfms_base_url:
            # TODO: Implement actual PFMS API call
            logger.info(f"PFMS API call placeholder: {reference_id}")
            pass

        return {
            "_source": "PLACEHOLDER",
            "_note": "PFMS integration pending. Connect API for real payment tracking.",
            "reference_id": reference_id,
            "status": "UNKNOWN",
            "amount": None,
            "payment_date": None,
        }

    # ─── Notifications ───────────────────────────────────────────────

    @staticmethod
    async def send_sms(phone: str, message: str) -> Dict[str, Any]:
        """
        Send SMS notification via NIC/CDAC SMS Gateway.
        Placeholder — logs the message.
        """
        if gov_api_config.sms_gateway_enabled and gov_api_config.sms_gateway_url:
            # TODO: Implement actual SMS gateway call
            logger.info(f"SMS Gateway call placeholder: {phone}")
            pass

        logger.info(f"[SMS PLACEHOLDER] To: {phone}, Message: {message[:50]}...")
        return {
            "_source": "PLACEHOLDER",
            "_note": "SMS gateway not configured. Message logged only.",
            "sent": False,
            "phone": phone,
        }

    @staticmethod
    async def send_email(to: str, subject: str, body: str) -> Dict[str, Any]:
        """
        Send email notification.
        Placeholder — logs the email.
        """
        if gov_api_config.email_service_enabled and gov_api_config.email_service_url:
            # TODO: Implement actual email service call
            logger.info(f"Email service call placeholder: {to}")
            pass

        logger.info(f"[EMAIL PLACEHOLDER] To: {to}, Subject: {subject}")
        return {
            "_source": "PLACEHOLDER",
            "_note": "Email service not configured. Message logged only.",
            "sent": False,
            "to": to,
        }


# Singleton instance
gov_gateway = GovAPIGateway()
