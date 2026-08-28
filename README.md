# Bhumi Mitra (भूमि मित्र) — National Land Acquisition Lifecycle Platform

[![Smart India Hackathon 2026](https://img.shields.io/badge/SIH-2026--SIH26016-orange.svg)](https://www.sih.gov.in/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%200.115+-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014%20(App%20Router)-black.svg?logo=next.js)](https://nextjs.org)
[![PostGIS](https://img.shields.io/badge/Database-PostgreSQL%2015%20%2B%20PostGIS-336791.svg?logo=postgresql)](https://postgis.net)
[![MapLibre GL](https://img.shields.io/badge/GIS-MapLibre%20GL%20JS-blue.svg?logo=maplibre)](https://maplibre.org)
[![MinIO](https://img.shields.io/badge/Object%20Storage-MinIO%20S3-C72C48.svg?logo=minio)](https://min.io)

**Bhumi Mitra** is a national-scale digital platform for end-to-end orchestration, GIS visualization, and role-based tracking of India's infrastructure land acquisition lifecycle (Highways, Railways, Irrigation, Industrial Corridors, Renewable Energy, and Urban Infrastructure).

Designed for **Smart India Hackathon (SIH26016)**, coordinating Central Ministries, State Governments, District Administrations, and Project Implementing Agencies.

---

## 🏛️ System Architecture & Domain Modules

The platform adopts a **domain-modular architecture** with a strict service-layer abstraction for all business logic:

```
Bhumi_Mitra/
├── backend/                        # FastAPI Python 3.11+ Backend
│   ├── alembic/                    # Database migrations (PostGIS hooks)
│   ├── app/
│   │   ├── core/                   # Config (Pydantic Settings), DB Session, Security (JWT/RBAC)
│   │   ├── modules/
│   │   │   ├── auth/               # User accounts, JWT auth, Agencies, RBAC guards
│   │   │   ├── projects/           # Project proposal lifecycle, GeoJSON boundary
│   │   │   ├── parcels/            # Parcel tracking, ULPIN uniqueness, GIS geometry
│   │   │   ├── workflow/           # 5-stage acquisition workflow & completion engine
│   │   │   ├── documents/          # MinIO S3 object storage & evidence attachment
│   │   │   ├── dashboard/          # Role-scoped summary statistics & audit log
│   │   │   └── mock_gov_api/       # Mock DILRMP/ULPIN land-record integration
│   │   └── scripts/
│   │       └── seed.py             # Idempotent seed for admin & government agencies
│   └── tests/                      # Pytest suite testing acceptance criteria
├── frontend/                       # Next.js 14 (App Router) + TypeScript
│   ├── src/
│   │   ├── app/
│   │   │   ├── login/              # Secure authentication portal
│   │   │   ├── dashboard/          # Role-scoped summary cards & recent projects
│   │   │   ├── projects/           # Project list & proposal creation with GIS drawer
│   │   │   ├── projects/[id]/      # Project detail, approval action, parcel map
│   │   │   ├── parcels/[id]/       # Parcel stage table, event forms & evidence docs
│   │   │   └── admin/users/        # User management & RBAC configuration
│   │   ├── components/
│   │   │   ├── map/                # MapLibre GIS viewer (ProjectMap, BoundaryDrawer)
│   │   │   ├── StageStatusList.tsx # Plain status table isolating workflow stages
│   │   │   └── StatusBadge.tsx     # Status indicator badges
│   │   └── lib/                    # API client, Auth context, TypeScript schemas
├── docker-compose.yml              # Multi-container orchestration
└── .env.example                    # Environment configuration template
```

---

## 🔒 Role-Based Access Control (RBAC) Matrix

| Action | Allowed Roles |
|---|---|
| **Create Project Proposal** | `PROJECT_AGENCY`, `CENTRAL_ADMIN` |
| **Approve / Reject Project** | `CENTRAL_ADMIN`, `STATE_ADMIN` |
| **Add / Edit Parcel Records** | `DISTRICT_AUTHORITY`, `CENTRAL_ADMIN` |
| **Record Notification Issued** | `DISTRICT_AUTHORITY` |
| **Record Award Declared** | `DISTRICT_AUTHORITY`, `STATE_ADMIN` |
| **Record Compensation Disbursed** | `DISTRICT_AUTHORITY`, `STATE_ADMIN` |
| **Record R&R Milestone** | `DISTRICT_AUTHORITY` |
| **Record Final Possession** | `DISTRICT_AUTHORITY` |
| **Upload Stage / Parcel Documents** | `DISTRICT_AUTHORITY`, `PROJECT_AGENCY`, `FIELD_OFFICER` |
| **View Dashboards (State Scoped)** | `STATE_ADMIN` (own state only) |
| **View Dashboards (District Scoped)**| `DISTRICT_AUTHORITY` (own district only) |
| **View Dashboards (National)** | `CENTRAL_ADMIN`, `AUDITOR` |
| **Manage Stakeholder Accounts** | `CENTRAL_ADMIN` only |
| **Read-Only Inspection** | `VIEWER` |

---

## ⚡ Core Business Rules

### 1. Parcel Completion Condition
A parcel's `overall_status` becomes **`COMPLETED`** if and only if **all** of the following are satisfied:
1. `NOTIFICATION` stage status is `COMPLETED`
2. `AWARD` stage status is `COMPLETED`
3. `COMPENSATION` stage status is `COMPLETED` **AND** compensation `payment_status` is `DISBURSED`
4. `RNR` (Rehabilitation & Resettlement) is `COMPLETED` **OR** `NOT_APPLICABLE`
5. `POSSESSION` stage status is `COMPLETED`

Otherwise, `overall_status` is `IN_PROGRESS` if any stage has moved past `PENDING`, else `PENDING`.

### 2. Stage-Specific Enforcement
- **Strict Ordering:** Stages must be completed in order (`Notification` → `Award` → `Compensation` → `R&R` → `Possession`). Out-of-order attempts return HTTP `409 Conflict` with clear prerequisite error messages.
- **R&R Auto-Resolution:** When a parcel has zero affected families, R&R automatically resolves to `NOT_APPLICABLE`.
- **Compensation Disbursal Gate:** Compensation with status `ASSESSED` or `APPROVED` keeps the stage at `IN_PROGRESS`. Only `DISBURSED` completes the stage.
- **ULPIN Uniqueness:** Duplicate ULPIN registration across any project is rejected with HTTP `409`.
- **Rejected Project Lockout:** Rejected projects reject parcel stage updates with HTTP `409`.

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)
- Node.js 20+ and Python 3.11+ (if running without Docker)

### Option A: Docker Compose (Recommended)

1. **Configure Environment:**
   ```bash
   cp .env.example .env
   ```
   *(Update passwords or secrets in `.env` if desired)*

2. **Start All Services (Database, MinIO, Backend, Frontend):**
   ```bash
   docker compose up --build -d
   ```

3. **Run Migrations & Seed Admin User:**
   ```bash
   docker compose exec backend alembic upgrade head
   docker compose exec backend python -m app.scripts.seed
   ```
   *(The seed script will output the initial generated admin password)*

4. **Open the Web Application:**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
   - MinIO Console: [http://localhost:9001](http://localhost:9001)

---

### Option B: Local Development (Manual)

1. **Start PostGIS and MinIO:**
   ```bash
   docker compose up -d postgres minio
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   pip install -r requirements.txt
   alembic upgrade head
   python -m app.scripts.seed
   uvicorn app.main:app --reload --port 8000
   ```

3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

---

## 🧪 Acceptance Testing Walkthrough

Follow this 8-step verification sequence to test the entire acquisition lifecycle:

1. **Sign in as Central Admin:**
   - Navigate to `/login`, enter `admin@bhumimitra.gov.in` and password `Admin@123456`.
2. **Create Stakeholder Users:**
   - Go to `/admin/users`, create a `PROJECT_AGENCY` user and a `STATE_ADMIN` user (State: *Maharashtra*).
3. **Submit Project Proposal:**
   - Sign in as `PROJECT_AGENCY`, go to `/projects`, click **New Project Proposal**, paste GeoJSON coordinates, and submit.
4. **Approve Project:**
   - Sign in as `STATE_ADMIN`, open the proposed project, and click **Approve Proposal**.
5. **Add Land Parcels:**
   - Create a `DISTRICT_AUTHORITY` user for Pune district, log in, open the approved project, and click **Add Parcel** (e.g. ULPIN: `ULPIN-MH-PUN-1001`, Area: `2.5` Ha).
6. **Execute Acquisition Stages in Sequence:**
   - Open the parcel detail page (`/parcels/[id]`).
   - Notice DILRMP verification card automatically populates owner and land-use information from mock registry.
   - Record **Notification** (issue date + gazette document).
   - Record **Award** (award date, amount, authority + order document).
   - Record **Compensation** with status `DISBURSED`.
   - Record **R&R** (0 affected families → auto-resolves to `NOT_APPLICABLE`).
   - Record **Possession** (possession date + certificate document).
7. **Verify Completion:**
   - Confirm parcel status transitions to **`COMPLETED`** (green badge).
   - Check `/dashboard` to verify updated statistics.
8. **Verify Out-of-Order Rejection:**
   - On a new parcel, attempting to record Possession directly will return a `409 Conflict` error.

---

## 📜 Problem Statement Compliance

- **Smart India Hackathon PS ID:** `SIH26016`
- **Scope Contract:** Clean architecture with extension feature flags in `core/config.py`.

---

## 📄 License

This project is developed for the **Smart India Hackathon 2026**.
