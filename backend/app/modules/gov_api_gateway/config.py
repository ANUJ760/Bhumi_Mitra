"""Government API Gateway Configuration.

Placeholder configuration for integration with Government of India API services.
These will be populated when API gateway access is granted.

Planned integrations:
- DILRMP (Digital India Land Records Modernisation Programme)
- Bhu-Naksha (Cadastral Map Service)
- ULPIN (Unique Land Parcel Identification Number)
- NIC Cloud (MeghRaj) APIs
- Aadhaar-based eKYC (for stakeholder verification)
- IndiaStack / DigiLocker (Document verification)
- PFMS (Public Financial Management System - for compensation tracking)
- SMS Gateway (NIC/CDAC)
- Email APIs (NIC email service)
"""
from pydantic import BaseModel
from typing import Optional


class GovAPIConfig(BaseModel):
    """Configuration for Government API Gateway connections."""

    # DILRMP - Land Records
    dilrmp_base_url: Optional[str] = None
    dilrmp_api_key: Optional[str] = None
    dilrmp_enabled: bool = False

    # Bhu-Naksha - Cadastral Maps
    bhunaksha_base_url: Optional[str] = None
    bhunaksha_api_key: Optional[str] = None
    bhunaksha_enabled: bool = False

    # ULPIN Service
    ulpin_base_url: Optional[str] = None
    ulpin_api_key: Optional[str] = None
    ulpin_enabled: bool = False

    # NIC Cloud / MeghRaj
    nic_cloud_base_url: Optional[str] = None
    nic_cloud_api_key: Optional[str] = None
    nic_cloud_enabled: bool = False

    # Aadhaar eKYC
    aadhaar_ekyc_base_url: Optional[str] = None
    aadhaar_ekyc_api_key: Optional[str] = None
    aadhaar_ekyc_enabled: bool = False

    # PFMS - Financial System
    pfms_base_url: Optional[str] = None
    pfms_api_key: Optional[str] = None
    pfms_enabled: bool = False

    # SMS Gateway (NIC/CDAC)
    sms_gateway_url: Optional[str] = None
    sms_gateway_api_key: Optional[str] = None
    sms_gateway_sender_id: Optional[str] = None
    sms_gateway_enabled: bool = False

    # Email Service
    email_service_url: Optional[str] = None
    email_service_api_key: Optional[str] = None
    email_service_enabled: bool = False


# Singleton config - populated from environment variables when available
gov_api_config = GovAPIConfig()
