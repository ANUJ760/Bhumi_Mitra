import pytest
import uuid
from app.modules.auth.models import RoleEnum
from app.modules.workflow.models import StageName

pytestmark = pytest.mark.asyncio


async def test_empty_dashboard_summary(client, seed_users):
    """Section 8.3 / Section 11: /dashboard/summary returns correct zeroed counts on an empty database."""
    token = seed_users["tokens"][RoleEnum.CENTRAL_ADMIN]
    headers = {"Authorization": f"Bearer {token}"}

    res = await client.get("/api/v1/dashboard/summary", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total_projects"] == 0
    assert data["total_parcels"] == 0
    assert data["projects_by_status"]["PROPOSED"] == 0
    assert data["parcels_by_status"]["COMPLETED"] == 0


async def test_central_admin_creates_users(client, seed_users):
    """Section 11: CENTRAL_ADMIN can create other users with any role. Non-admin gets 403."""
    admin_token = seed_users["tokens"][RoleEnum.CENTRAL_ADMIN]
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Admin creates a user
    res = await client.post(
        "/api/v1/users",
        headers=headers,
        json={
            "name": "New State Official",
            "email": "official@state.gov.in",
            "password": "Password123!",
            "role": "STATE_ADMIN",
            "state_scope": "Gujarat",
        },
    )
    assert res.status_code == 201
    assert res.json()["email"] == "official@state.gov.in"
    assert res.json()["role"] == "STATE_ADMIN"

    # Non-admin attempting to create a user gets 403
    viewer_token = seed_users["tokens"][RoleEnum.VIEWER]
    res_forbidden = await client.post(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {viewer_token}"},
        json={
            "name": "Hacker",
            "email": "hacker@test.com",
            "password": "Password123!",
            "role": "CENTRAL_ADMIN",
        },
    )
    assert res_forbidden.status_code == 403


async def test_project_proposal_and_approval_workflow(client, seed_users):
    """Section 11: PROJECT_AGENCY submits proposal, STATE_ADMIN approves, VIEWER/others cannot approve."""
    agency_token = seed_users["tokens"][RoleEnum.PROJECT_AGENCY]
    state_token = seed_users["tokens"][RoleEnum.STATE_ADMIN]
    viewer_token = seed_users["tokens"][RoleEnum.VIEWER]

    # 1. Project Agency submits project
    create_res = await client.post(
        "/api/v1/projects",
        headers={"Authorization": f"Bearer {agency_token}"},
        json={
            "name": "Pune-Solapur Expressway",
            "project_type": "road",
            "state": "Maharashtra",
            "district": "Pune",
            "budget": 500000000.0,
            "boundary_geojson": {
                "type": "Polygon",
                "coordinates": [[[73.85, 18.52], [73.86, 18.52], [73.86, 18.53], [73.85, 18.53], [73.85, 18.52]]]
            }
        },
    )
    assert create_res.status_code == 201
    project_id = create_res.json()["id"]
    assert create_res.json()["status"] == "PROPOSED"

    # 2. Viewer tries to approve -> 403
    forbidden_res = await client.patch(
        f"/api/v1/projects/{project_id}/status",
        headers={"Authorization": f"Bearer {viewer_token}"},
        json={"status": "APPROVED"},
    )
    assert forbidden_res.status_code == 403

    # 3. State Admin approves
    approve_res = await client.patch(
        f"/api/v1/projects/{project_id}/status",
        headers={"Authorization": f"Bearer {state_token}"},
        json={"status": "APPROVED"},
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "APPROVED"


async def test_parcel_creation_and_duplicate_prevention(client, seed_users):
    """Section 8.3 / Section 11: DISTRICT_AUTHORITY adds parcel, duplicate ULPIN is rejected with 409."""
    dist_token = seed_users["tokens"][RoleEnum.DISTRICT_AUTHORITY]
    admin_token = seed_users["tokens"][RoleEnum.CENTRAL_ADMIN]

    # Create & approve project first
    p_res = await client.post(
        "/api/v1/projects",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "name": "Nagpur Metro Phase 2",
            "project_type": "rail",
            "state": "Maharashtra",
            "district": "Nagpur",
        },
    )
    p_id = p_res.json()["id"]
    await client.patch(f"/api/v1/projects/{p_id}/status", headers={"Authorization": f"Bearer {admin_token}"}, json={"status": "APPROVED"})

    # Add parcel
    parcel_res = await client.post(
        f"/api/v1/projects/{p_id}/parcels",
        headers={"Authorization": f"Bearer {dist_token}"},
        json={"ulpin": "ULPIN-MH-NGP-9901", "area_hectares": 3.5},
    )
    assert parcel_res.status_code == 201
    assert parcel_res.json()["overall_status"] == "PENDING"

    # Add duplicate ULPIN -> 409 Conflict
    dup_res = await client.post(
        f"/api/v1/projects/{p_id}/parcels",
        headers={"Authorization": f"Bearer {dist_token}"},
        json={"ulpin": "ULPIN-MH-NGP-9901", "area_hectares": 1.2},
    )
    assert dup_res.status_code == 409
    assert "already exists" in dup_res.json()["detail"]


async def test_strict_stage_ordering_and_completion_rules(client, seed_users):
    """
    Section 8.1 & 8.2 & 11:
    - Stages can only be completed in order: Notification -> Award -> Compensation -> R&R -> Possession
    - Server-side enforcement with 409 Conflict
    - R&R auto-resolves to NOT_APPLICABLE when affected families = 0
    - Compensation with APPROVED status keeps stage IN_PROGRESS, parcel overall_status remains IN_PROGRESS
    - Compensation with DISBURSED status marks stage COMPLETED
    - Overall status only becomes COMPLETED when Section 8.1 rule is completely satisfied
    """
    admin_token = seed_users["tokens"][RoleEnum.CENTRAL_ADMIN]
    dist_token = seed_users["tokens"][RoleEnum.DISTRICT_AUTHORITY]
    headers_dist = {"Authorization": f"Bearer {dist_token}"}
    headers_admin = {"Authorization": f"Bearer {admin_token}"}

    # 1. Setup project and parcel
    p_res = await client.post(
        "/api/v1/projects",
        headers=headers_admin,
        json={"name": "Pune Highway Project", "project_type": "road", "state": "Maharashtra", "district": "Pune"},
    )
    p_id = p_res.json()["id"]
    await client.patch(f"/api/v1/projects/{p_id}/status", headers=headers_admin, json={"status": "APPROVED"})

    parcel_res = await client.post(
        f"/api/v1/projects/{p_id}/parcels",
        headers=headers_dist,
        json={"ulpin": "ULPIN-MH-PUN-5501", "area_hectares": 2.5},
    )
    parcel_id = parcel_res.json()["id"]
    dummy_doc_id = str(uuid.uuid4())

    # 2. Try recording AWARD before NOTIFICATION -> 409 Conflict
    out_of_order_award = await client.post(
        f"/api/v1/parcels/{parcel_id}/stages/AWARD",
        headers=headers_dist,
        json={"award_amount": 1000000, "award_date": "2026-01-15", "authority": "CALA", "document_id": dummy_doc_id},
    )
    assert out_of_order_award.status_code == 409
    assert "Cannot record award before notification is complete" in out_of_order_award.json()["detail"]

    # 3. Complete Stage 1: NOTIFICATION
    notif_res = await client.post(
        f"/api/v1/parcels/{parcel_id}/stages/NOTIFICATION",
        headers=headers_dist,
        json={"notification_date": "2026-01-10", "document_id": dummy_doc_id},
    )
    assert notif_res.status_code == 200

    # 4. Complete Stage 2: AWARD
    award_res = await client.post(
        f"/api/v1/parcels/{parcel_id}/stages/AWARD",
        headers=headers_dist,
        json={"award_amount": 1500000, "award_date": "2026-02-15", "authority": "CALA", "document_id": dummy_doc_id},
    )
    assert award_res.status_code == 200

    # 5. Stage 3: COMPENSATION with payment_status = APPROVED (NOT DISBURSED)
    comp_approved_res = await client.post(
        f"/api/v1/parcels/{parcel_id}/stages/COMPENSATION",
        headers=headers_dist,
        json={"assessed_amount": 1500000, "approved_amount": 1500000, "payment_status": "APPROVED"},
    )
    assert comp_approved_res.status_code == 200
    assert comp_approved_res.json()["status"] == "IN_PROGRESS"

    # Verify parcel overall_status is IN_PROGRESS (not COMPLETED)
    status_check = await client.get(f"/api/v1/parcels/{parcel_id}/completion", headers=headers_dist)
    assert status_check.json()["overall_status"] == "IN_PROGRESS"

    # Try recording POSSESSION while COMPENSATION is not completed -> 409 Conflict
    poss_early = await client.post(
        f"/api/v1/parcels/{parcel_id}/stages/POSSESSION",
        headers=headers_dist,
        json={"possession_date": "2026-05-01", "document_id": dummy_doc_id},
    )
    assert poss_early.status_code == 409

    # Now set compensation payment_status = DISBURSED -> Stage 3 COMPLETED
    comp_disbursed_res = await client.post(
        f"/api/v1/parcels/{parcel_id}/stages/COMPENSATION",
        headers=headers_dist,
        json={"assessed_amount": 1500000, "approved_amount": 1500000, "disbursed_amount": 1500000, "disbursed_date": "2026-03-01", "payment_status": "DISBURSED"},
    )
    assert comp_disbursed_res.status_code == 200
    assert comp_disbursed_res.json()["status"] == "COMPLETED"

    # 6. Stage 4: RNR with 0 affected families -> Auto-resolves to NOT_APPLICABLE
    rnr_res = await client.post(
        f"/api/v1/parcels/{parcel_id}/stages/RNR",
        headers=headers_dist,
        json={"affected_families_count": 0},
    )
    assert rnr_res.status_code == 200
    assert rnr_res.json()["status"] == "NOT_APPLICABLE"

    # 7. Complete Stage 5: POSSESSION
    poss_res = await client.post(
        f"/api/v1/parcels/{parcel_id}/stages/POSSESSION",
        headers=headers_dist,
        json={"possession_date": "2026-04-01", "document_id": dummy_doc_id},
    )
    assert poss_res.status_code == 200
    assert poss_res.json()["status"] == "COMPLETED"

    # 8. Verify parcel reaches overall_status = COMPLETED per Section 8.1 rule
    completion_final = await client.get(f"/api/v1/parcels/{parcel_id}/completion", headers=headers_dist)
    assert completion_final.json()["overall_status"] == "COMPLETED"


async def test_mock_land_records_endpoint(client, seed_users):
    """Section 9 & 11: Mock government land records lookup endpoint returns expected JSON fixture."""
    token = seed_users["tokens"][RoleEnum.VIEWER]
    res = await client.get("/api/v1/mock-gov/land-records?ulpin=ULPIN-MH-PUN-1001", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["ulpin"] == "ULPIN-MH-PUN-1001"
    assert data["owner_name"] == "Ramesh Patil"
    assert data["source_system"] == "DILRMP-MOCK"
