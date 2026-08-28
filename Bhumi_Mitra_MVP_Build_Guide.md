# Bhumi Mitra — MVP Build Guide

**Audience:** This document has two parts. **Part A** is written as direct instructions for an AI coding agent building the system. **Part B** is written for the human operator, covering accounts, placeholders, and local setup. Read Part A fully before writing any code. Do not skip sections.

---

# PART A — INSTRUCTIONS FOR THE BUILDING AGENT

## 0. Scope Contract — Read This First

These rules are non-negotiable and override any instinct to "improve" or "complete" the system beyond what is specified:

1. **Build only what Section 2 lists as In Scope.** Do not implement anything in Section 2's Out of Scope list, even partially, even as a stub UI button that does nothing. If a feature is out of scope, it should not appear anywhere in the UI or API — not disabled, not greyed out, not present.
2. **Use exactly the tech stack in Section 3.** Do not substitute a library, framework, or database because it seems easier or more familiar. If something in Section 3 is ambiguous, ask rather than guess.
3. **Follow the architecture principles in Section 4 even though they add short-term effort.** The system will be extended after this MVP. Code that works but violates the decoupling rules in Section 4 is not acceptable, because it will block future work.
4. **Every external system (land records, cadastral maps, government finance) is mocked in this MVP.** Never call a real third-party government API. Build against the mock service contracts in Section 11 and read real credentials only from environment variables that do not yet have real values (see Section 10 and Part B).
5. **When you encounter an edge case not explicitly covered below, prefer the stricter/safer interpretation** (reject the action, return a clear error) over a permissive one, and leave a `# TODO: confirm business rule` comment rather than inventing a rule silently.
6. **Do not add authentication shortcuts, seed super-admin accounts with hardcoded passwords in code, or disable RBAC checks "for now."** If you need a way to test as different roles, use the seed data described in Part B, not a bypass in application code.

## 1. Project Overview

Bhumi Mitra is a national web platform (Smart India Hackathon PS SIH26016) that digitizes India's land acquisition lifecycle — from project proposal through final possession — for infrastructure projects (highways, railways, irrigation, industrial corridors, renewable energy). It coordinates Central Ministries, State Governments, District Administrations, and Project Implementing Agencies through a single, role-based workflow. It does **not** replace existing government land-record systems (DILRMP, Bhu-Naksha, ULPIN); it integrates with them (mocked in this MVP) and adds workflow orchestration, GIS visualization, document management, and basic reporting on top.

## 2. MVP Scope

### 2.1 In Scope — Must Build

| # | Feature | Why (PS requirement) |
|---|---|---|
| 1 | User accounts + Role-Based Access Control | PS requires secure, role-based access |
| 2 | Project proposal creation & approval routing | PS requires online proposal management |
| 3 | Parcel records linked to a project, with geometry | PS requires GIS-based parcel tracking |
| 4 | Acquisition workflow stage tracking per parcel (Notification → Award → Compensation → R&R → Possession) | PS requires end-to-end workflow digitization |
| 5 | Document upload & storage, linked to stages | PS requires secure document management |
| 6 | Basic GIS map showing project boundary + parcels | PS requires GIS-based visualization |
| 7 | Basic dashboards (project/state/national counts) | PS requires MIS/dashboard reporting |
| 8 | Basic audit log (who changed what, when) | PS requires accountability/traceability |
| 9 | Mocked government API layer (land records, cadastral, finance) | PS requires API-based government integration |

### 2.2 Out of Scope — Do Not Build in This MVP

These are real, planned features of the full product, but **none of them belong in this MVP**. Do not implement any of the following. Leave clean extension points instead (see Section 4.4):

- Interactive "Acquisition Tree + Timeline + Map" linked visualization (React Flow tree UI) — MVP uses a plain status table instead
- Permissioned blockchain / Hyperledger Fabric audit ledger — MVP uses a normal relational audit log table instead
- AI/ML delay prediction (XGBoost + SHAP)
- AI document extraction / OCR / inconsistency detection
- Natural-language query assistant (LangChain/RAG)
- GIS spatial conflict detection, impact-summary computation
- AI-generated "future project" visualization / digital twin views
- Zero-knowledge payment verification
- 3D GIS (CesiumJS)
- Any multilingual/regional-language support

### 2.3 Explicit Non-Goals

- No mobile native app — the web frontend must be responsive, that is sufficient.
- No real payment processing or real government API calls of any kind.
- No production-grade Kubernetes deployment — a working Docker Compose setup is the MVP deployment target.

## 3. Tech Stack — Use Exactly This

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Next.js (App Router) + TypeScript | |
| Styling | Tailwind CSS + shadcn/ui | |
| Map | MapLibre GL JS | No CesiumJS, no 3D, in this MVP |
| Backend | FastAPI (Python 3.11+) | |
| Validation | Pydantic v2 | All request/response models must use Pydantic schemas, no raw dicts |
| Database | PostgreSQL 15+ with PostGIS extension | One database, no microservice-per-table split |
| ORM | SQLAlchemy 2.0 (async) + Alembic for migrations | |
| Auth | JWT-based auth issued by the backend itself (see 4.5) | Do NOT stand up Keycloak for this MVP — see note below |
| Object storage | MinIO (S3-compatible), local Docker container | |
| Background jobs | Not required for MVP. Do not add Celery/Redis unless a specific MVP feature needs async processing (none do). Leave the dependency out entirely. |
| Containerization | Docker + Docker Compose (local dev only, no cloud deployment required for MVP) | |

**Note on Auth:** the full product's target stack includes Keycloak/OAuth2/OIDC for production-grade identity. For this MVP, implement a simpler self-contained JWT auth (FastAPI + `python-jose` + bcrypt password hashing) with the same role model, so the system is fully functional standalone without external identity infrastructure. Structure the auth module (Section 4.4) so it can be swapped for Keycloak later without touching business logic — i.e., route handlers should depend on a `get_current_user()` dependency that returns a `User` object; the internal implementation of that dependency is what gets replaced later, not its call sites.

## 4. Architecture Principles

### 4.1 Modular Backend Structure

Organize the FastAPI backend by domain module, not by technical layer. Each module owns its own router, schemas, service functions, and database models file. Example:

```
backend/
  app/
    core/           # config, db session, security utilities
    modules/
      auth/
        router.py
        schemas.py
        service.py
        models.py
      projects/
        router.py
        schemas.py
        service.py
        models.py
      parcels/
      workflow/
      documents/
      dashboard/
      mock_gov_api/   # mocked external integrations live here
    main.py           # mounts all module routers under /api/v1/
```

### 4.2 Versioned API

All endpoints are mounted under `/api/v1/`. Never mount an endpoint outside this prefix. This makes it possible to introduce `/api/v2/` later for breaking changes without disrupting the MVP.

### 4.3 Service-Layer Abstraction (required, not optional)

Route handlers must never contain business logic directly. Every route handler calls a function in that module's `service.py`. This matters specifically because of what comes later:

- `workflow/service.py` must expose a single function, e.g. `record_stage_event(stage_id, event_data, actor)`, that route handlers call. Internally, this function updates the database AND calls a placeholder `audit_service.log_event(...)`. When the blockchain audit trail is added later, only `audit_service` needs to change — `workflow/service.py` and every route handler stay untouched.
- Similarly, `parcels/service.py` must expose `get_parcel_completion_status(parcel_id)` as the single source of truth for whether a parcel is complete, computed from the rules in Section 8.1. This function is where a future rules engine would plug in — do not scatter completion logic across multiple files.

### 4.4 Feature Flags (scaffolding only, not implemented features)

In `core/config.py`, define (but leave set to `False`/unused) the following flags, so future differentiator work has an obvious place to plug in:

```python
ENABLE_BLOCKCHAIN_AUDIT: bool = False
ENABLE_DELAY_PREDICTION: bool = False
ENABLE_DOCUMENT_AI: bool = False
ENABLE_NL_QUERY: bool = False
ENABLE_ACQUISITION_TREE_UI: bool = False
```

Do not build the features these flags would enable. Their only purpose is to mark, in the codebase, where future work attaches.

### 4.5 RBAC Model

Roles (fixed enum, do not add or rename): `CENTRAL_ADMIN`, `STATE_ADMIN`, `DISTRICT_AUTHORITY`, `PROJECT_AGENCY`, `FIELD_OFFICER`, `AUDITOR`, `VIEWER`.

Permission rules (implement exactly, this list is exhaustive for the MVP):

| Action | Allowed roles |
|---|---|
| Create project proposal | `PROJECT_AGENCY`, `CENTRAL_ADMIN` |
| Approve/reject project proposal | `CENTRAL_ADMIN`, `STATE_ADMIN` |
| Add/edit parcel records | `DISTRICT_AUTHORITY`, `CENTRAL_ADMIN` |
| Record notification issued | `DISTRICT_AUTHORITY` |
| Record award declared | `DISTRICT_AUTHORITY`, `STATE_ADMIN` |
| Record compensation assessed/disbursed | `DISTRICT_AUTHORITY`, `STATE_ADMIN` |
| Record R&R milestone | `DISTRICT_AUTHORITY` |
| Record possession | `DISTRICT_AUTHORITY` |
| Upload documents | `DISTRICT_AUTHORITY`, `PROJECT_AGENCY`, `FIELD_OFFICER` |
| View dashboards (scoped to own state/district) | `STATE_ADMIN` (own state only), `DISTRICT_AUTHORITY` (own district only) |
| View dashboards (all data) | `CENTRAL_ADMIN`, `AUDITOR` |
| Manage users | `CENTRAL_ADMIN` only |
| Read-only access to everything visible to their scope | `VIEWER` |

Any action not listed above is forbidden for all roles except `CENTRAL_ADMIN`. If a route needs a permission not in this table, stop and flag it rather than guessing.

## 5. Database Schema — MVP Tables Only

Do not create tables for anything in the Out of Scope list (no `ledger_events`, `delay_scores`, `document_extractions`, `inconsistency_flags`, `spatial_conflicts`, `impact_summary`, `nl_queries`, `project_visuals`). Create exactly these:

```sql
-- users & access
CREATE TABLE agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,           -- e.g. 'ministry','state_dept','district_office','implementing_agency'
    state TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE user_role AS ENUM (
    'CENTRAL_ADMIN','STATE_ADMIN','DISTRICT_AUTHORITY',
    'PROJECT_AGENCY','FIELD_OFFICER','AUDITOR','VIEWER'
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL,
    agency_id UUID REFERENCES agencies(id),
    state_scope TEXT,             -- NULL = not state-scoped
    district_scope TEXT,          -- NULL = not district-scoped
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- projects & parcels
CREATE TYPE project_status AS ENUM ('PROPOSED','APPROVED','ACTIVE','COMPLETED','REJECTED');

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    project_type TEXT NOT NULL,        -- 'road','rail','irrigation','industrial','renewable','urban'
    requiring_body_id UUID REFERENCES agencies(id),
    implementing_agency_id UUID REFERENCES agencies(id),
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    boundary_geometry GEOMETRY(POLYGON, 4326),
    budget NUMERIC,
    status project_status NOT NULL DEFAULT 'PROPOSED',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE parcel_status AS ENUM ('PENDING','IN_PROGRESS','COMPLETED');

CREATE TABLE parcels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ulpin TEXT NOT NULL UNIQUE,
    project_id UUID NOT NULL REFERENCES projects(id),
    geometry GEOMETRY(POLYGON, 4326),
    area_hectares NUMERIC NOT NULL,
    overall_status parcel_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- workflow
CREATE TYPE stage_name AS ENUM ('NOTIFICATION','AWARD','COMPENSATION','RNR','POSSESSION');
CREATE TYPE stage_status AS ENUM ('PENDING','IN_PROGRESS','COMPLETED','NOT_APPLICABLE');

CREATE TABLE acquisition_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parcel_id UUID NOT NULL REFERENCES parcels(id),
    stage_name stage_name NOT NULL,
    status stage_status NOT NULL DEFAULT 'PENDING',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    evidence_document_id UUID,   -- FK added after documents table below
    recorded_by UUID REFERENCES users(id),
    UNIQUE (parcel_id, stage_name)
);

CREATE TABLE awards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parcel_id UUID NOT NULL REFERENCES parcels(id) UNIQUE,
    award_amount NUMERIC NOT NULL,
    award_date DATE NOT NULL,
    authority TEXT NOT NULL
);

CREATE TYPE payment_status AS ENUM ('ASSESSED','APPROVED','DISBURSED');

CREATE TABLE compensation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parcel_id UUID NOT NULL REFERENCES parcels(id) UNIQUE,
    assessed_amount NUMERIC NOT NULL,
    approved_amount NUMERIC,
    disbursed_amount NUMERIC,
    disbursed_date DATE,
    payment_status payment_status NOT NULL DEFAULT 'ASSESSED'
);

CREATE TABLE affected_families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parcel_id UUID NOT NULL REFERENCES parcels(id),
    household_ref TEXT NOT NULL,
    displaced BOOLEAN NOT NULL DEFAULT false,
    resettled BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE rnr_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parcel_id UUID NOT NULL REFERENCES parcels(id) UNIQUE,
    entitlement_confirmed BOOLEAN NOT NULL DEFAULT false,
    package_disbursed BOOLEAN NOT NULL DEFAULT false,
    completed_date DATE
);

CREATE TABLE possession_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parcel_id UUID NOT NULL REFERENCES parcels(id) UNIQUE,
    possession_date DATE NOT NULL,
    certificate_document_id UUID
);

-- documents
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    related_entity_type TEXT NOT NULL,  -- 'parcel','project','stage'
    related_entity_id UUID NOT NULL,
    doc_type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE acquisition_stages
    ADD CONSTRAINT fk_evidence_doc FOREIGN KEY (evidence_document_id) REFERENCES documents(id);
ALTER TABLE possession_records
    ADD CONSTRAINT fk_cert_doc FOREIGN KEY (certificate_document_id) REFERENCES documents(id);

-- audit (plain log — NOT the hash-chained ledger, that is out of scope)
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT NOT NULL,
    actor_id UUID REFERENCES users(id),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    old_value JSONB,
    new_value JSONB
);
```

Enable PostGIS before running migrations: `CREATE EXTENSION IF NOT EXISTS postgis;`

## 6. API Endpoints

All under `/api/v1/`. Every endpoint requires a valid JWT unless marked public. Every write endpoint must check the RBAC table in 4.5 and return `403` if the caller's role is not permitted.

| Method | Path | Purpose | Allowed roles |
|---|---|---|---|
| POST | `/auth/login` | Public. Returns JWT | — |
| GET | `/auth/me` | Current user info | any authenticated |
| POST | `/users` | Create user | `CENTRAL_ADMIN` |
| GET | `/users` | List users | `CENTRAL_ADMIN` |
| POST | `/projects` | Create project proposal | see 4.5 |
| GET | `/projects` | List projects (scoped by caller's state/district if applicable) | any authenticated |
| GET | `/projects/{id}` | Project detail | any authenticated |
| PATCH | `/projects/{id}/status` | Approve/reject | see 4.5 |
| POST | `/projects/{id}/parcels` | Add parcel to project | see 4.5 |
| GET | `/projects/{id}/parcels` | List parcels for project | any authenticated |
| GET | `/parcels/{id}` | Parcel detail incl. all stage statuses | any authenticated |
| POST | `/parcels/{id}/stages/{stage_name}` | Record a stage event (see 8.2 for exact behavior per stage) | see 4.5 |
| GET | `/parcels/{id}/completion` | Returns computed completion status (Section 8.1) | any authenticated |
| POST | `/documents` | Upload document (multipart) | see 4.5 |
| GET | `/documents?related_entity_id=` | List documents for an entity | any authenticated |
| GET | `/dashboard/summary` | Aggregate counts, scoped to caller (Section 9.6) | any authenticated |
| GET | `/mock-gov/land-records?ulpin=` | Mocked land record lookup (Section 11) | any authenticated |

## 7. Frontend Pages — MVP Only

Build exactly these pages. Do not build a page for anything in the Out of Scope list.

1. `/login` — email/password form
2. `/dashboard` — role-scoped summary cards (counts from `/dashboard/summary`) + a simple table of recent projects
3. `/projects` — list, with a "New Project" form (name, type, requiring body, state, district, boundary — drawn or pasted as GeoJSON on a MapLibre map)
4. `/projects/[id]` — project detail: metadata, approve/reject button (if permitted), parcel list, map showing project boundary + all parcels colored by `overall_status`
5. `/parcels/[id]` — parcel detail: metadata, a **plain status table** (not a tree — explicitly out of scope) listing all 5 stages with status and a "Record Event" button per stage (opens a form matching Section 8.2's required fields for that stage), document list with upload button
6. `/admin/users` — user list + create form, visible only to `CENTRAL_ADMIN`

Component note: build the stage-status display in `parcels/[id]` as its own component, `StageStatusList`, that takes `stages: Stage[]` as a prop and renders a table. This isolates it so it can be swapped for the tree/timeline visualization later without touching the page or the data-fetching logic.

## 8. Core Business Rules — Implement Exactly

### 8.1 Parcel Completion Rule

A parcel's `overall_status` becomes `COMPLETED` if and only if **all** of the following are true. Recompute this every time any underlying stage changes (call this function from `workflow/service.py` after every stage write):

```
parcel.overall_status = COMPLETED  IFF:
  - acquisition_stages[NOTIFICATION].status == COMPLETED
  AND acquisition_stages[AWARD].status == COMPLETED
  AND acquisition_stages[COMPENSATION].status == COMPLETED
    AND compensation.payment_status == DISBURSED
  AND ( acquisition_stages[RNR].status == COMPLETED
        OR acquisition_stages[RNR].status == NOT_APPLICABLE )
  AND acquisition_stages[POSSESSION].status == COMPLETED
```

Otherwise, `overall_status = IN_PROGRESS` if any stage has moved past `PENDING`, else `PENDING`.

### 8.2 Stage-Specific Rules (exact required fields and edge cases)

**NOTIFICATION:** requires `notification_date` and an uploaded document. On submit, create/attach the document, set stage `status = COMPLETED`, `completed_at = now()`.

**AWARD:** requires a linked `awards` row (amount, date, authority) and an uploaded document. Reject if `NOTIFICATION` stage is not yet `COMPLETED` — return `409 Conflict` with a clear message ("Cannot record award before notification is complete"). This ordering check applies to every stage below: **a stage cannot be marked complete out of order.**

**COMPENSATION:** requires a `compensation` row. This stage's `status` becomes `COMPLETED` only when `payment_status == DISBURSED` — an `ASSESSED` or `APPROVED` compensation row keeps the stage at `IN_PROGRESS`, not `COMPLETED`. Reject if `AWARD` is not complete.

**RNR (Rehabilitation & Resettlement):** if the parcel has zero rows in `affected_families`, set this stage directly to `NOT_APPLICABLE` (do not require manual entry). If it has one or more affected families, the stage becomes `COMPLETED` only when every linked `affected_families` row has `resettled = true` AND the `rnr_records` row has `package_disbursed = true`. Reject if `COMPENSATION` is not complete.

**POSSESSION:** requires `possession_date` and a certificate document. Reject if `RNR` is not `COMPLETED` or `NOT_APPLICABLE`, or if `COMPENSATION` is not `COMPLETED`.

### 8.3 Edge Cases to Handle Explicitly

- **Duplicate ULPIN:** reject parcel creation with `409` if the ULPIN already exists anywhere in the system (not just within the same project) — a real parcel cannot belong to two projects simultaneously in this MVP; do not silently allow it.
- **Parcel geometry outside project boundary:** do not block creation (real-world boundaries are approximate), but log a warning in `audit_log` with action `"parcel_outside_boundary_warning"`. Do not fail the request.
- **Attempting to skip a stage:** return `409` with the specific missing prerequisite named in the error message, per 8.2.
- **Project rejected after parcels exist:** if a project's status is set to `REJECTED`, all its parcels' stage-recording endpoints must return `409` ("Cannot modify parcels of a rejected project"). Existing data is not deleted.
- **Concurrent stage updates:** use a database-level unique constraint (already present via `UNIQUE (parcel_id, stage_name)`) and standard optimistic handling — if two requests race, the second write should simply overwrite with its own actor/timestamp; no special locking is required for the MVP.
- **Empty dashboard (no data yet):** `/dashboard/summary` must return valid zeroed counts, not an error, when the database has no projects yet.

## 9. Mocked External Integrations

Build these as real, working endpoints inside `modules/mock_gov_api/`, backed by static or seeded fixture data — not by calling any real external service.

- **`GET /mock-gov/land-records?ulpin=`** — returns a fixed JSON shape: `{ulpin, owner_name, area_hectares, land_use, source_system: "DILRMP-MOCK"}`. Seed 20-30 fixture records with plausible Indian names/areas for demo purposes.
- Document this mock clearly in code comments as: `# MOCK — replace with real DILRMP/Bhu-Naksha/ULPIN integration in production`.
- Do not build a mock for the government finance/payment system in this MVP — compensation `payment_status` is set manually via the API in this MVP, standing in for that future integration.

## 10. Environment Variables the Agent Must Read (Never Hardcode)

Read every one of these from environment variables via `core/config.py` (a Pydantic `Settings` class). Never hardcode a default that looks like a real credential. See Part B for the actual values a human will supply locally.

```
DATABASE_URL=
JWT_SECRET_KEY=
JWT_ALGORITHM=HS256
JWT_EXPIRY_MINUTES=
MINIO_ENDPOINT=
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=
MINIO_BUCKET_NAME=
FRONTEND_ORIGIN=          # for CORS
```

## 11. Acceptance Criteria — Definition of Done

The MVP is complete when all of the following are true:

- [ ] A `CENTRAL_ADMIN` can create other users with any role
- [ ] A `PROJECT_AGENCY` user can submit a project with a drawn/pasted boundary
- [ ] A `STATE_ADMIN` can approve that project
- [ ] A `DISTRICT_AUTHORITY` can add parcels to the approved project
- [ ] Stages can only be completed in order (Notification → Award → Compensation → R&R → Possession), enforced server-side, not just hidden in the UI
- [ ] A parcel with zero affected families auto-resolves R&R to `NOT_APPLICABLE`
- [ ] A parcel only reaches `overall_status = COMPLETED` when Section 8.1's full rule is satisfied — verified by a test that tries to mark it complete with compensation only `APPROVED` (not `DISBURSED`) and confirms it stays `IN_PROGRESS`
- [ ] The map on a project's detail page renders the boundary and all parcels, color-coded by status
- [ ] `/dashboard/summary` returns correct counts and works on an empty database
- [ ] Every write endpoint enforces the RBAC table in Section 4.5 and returns `403` for disallowed roles
- [ ] No code exists anywhere for any item in Section 2.2's Out of Scope list

---

# PART B — FOR THE HUMAN OPERATOR

## B.1 What You Need Before Starting

- Docker and Docker Compose installed locally
- Node.js 20+ and Python 3.11+ (only needed if running frontend/backend outside Docker for development)
- No real government API credentials are required for this MVP — everything external is mocked (Section 9)

## B.2 Services You Are Running Locally (via Docker Compose)

| Service | Purpose | Real account needed? |
|---|---|---|
| PostgreSQL + PostGIS | Main database | No — runs locally in a container, you choose the password |
| MinIO | Document/object storage | No — runs locally in a container, you choose the access/secret keys |
| Backend (FastAPI) | API | No external accounts |
| Frontend (Next.js) | Web UI | No external accounts |

Nothing in this MVP requires you to register for any external API key, government portal access, or cloud account. That is intentional — Section 9 mocks every external dependency so the system runs fully self-contained on a laptop.

## B.3 `.env` File Template

Create a `.env` file at the project root with the following. Replace the placeholder values as noted — none of these need to be real government credentials, they are local infrastructure secrets you invent yourself:

```
# Database — invent a password, this stays entirely on your machine
DATABASE_URL=postgresql+asyncpg://bhumi_mitra:CHANGE_ME_PASSWORD@localhost:5432/bhumi_mitra_db

# JWT — generate a random 32+ character string, e.g. `openssl rand -hex 32`
JWT_SECRET_KEY=CHANGE_ME_RANDOM_SECRET
JWT_ALGORITHM=HS256
JWT_EXPIRY_MINUTES=480

# MinIO — invent access/secret keys, these are local-only
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=CHANGE_ME_MINIO_ACCESS
MINIO_SECRET_KEY=CHANGE_ME_MINIO_SECRET
MINIO_BUCKET_NAME=bhumi-mitra-documents

# Frontend origin for CORS
FRONTEND_ORIGIN=http://localhost:3000
```

## B.4 Setup Steps

1. Copy the template above into `.env` and fill in your own values for every `CHANGE_ME_*` placeholder.
2. Run `docker compose up -d postgres minio` to start the database and object storage.
3. Run the backend database migrations: `cd backend && alembic upgrade head`.
4. Seed initial data (creates a `CENTRAL_ADMIN` user and the mock land-record fixtures): `python -m app.scripts.seed`.
5. Start the backend: `cd backend && uvicorn app.main:app --reload`.
6. Start the frontend: `cd frontend && npm install && npm run dev`.
7. Visit `http://localhost:3000/login` and sign in with the seeded admin account (the seed script will print the generated email/password to the console on first run — change this password after first login).

## B.5 How to Verify It's Working

Walk through this sequence once setup is complete — it exercises every core module:

1. Log in as the seeded `CENTRAL_ADMIN`.
2. Create a `PROJECT_AGENCY` user and a `STATE_ADMIN` user via `/admin/users`.
3. Log in as the `PROJECT_AGENCY` user, create a project with a drawn boundary.
4. Log in as the `STATE_ADMIN` user, approve the project.
5. Create a `DISTRICT_AUTHORITY` user, log in as them, add 2-3 parcels to the project.
6. Record a Notification, then Award, then Compensation (set to `DISBURSED`) for one parcel, confirm R&R auto-resolves to Not Applicable if no affected families were added, then record Possession.
7. Confirm that parcel's status shows `COMPLETED` on `/dashboard/summary` and in the parcel detail page.
8. Confirm attempting to record Possession on a *different* parcel that hasn't had Compensation recorded yet returns a clear error rather than succeeding.

If all eight steps work as described, the MVP meets its acceptance criteria.

## B.6 What This Setup Deliberately Does Not Include

To avoid confusion later: this local setup does not include Keycloak, Redis, Celery, Hyperledger Fabric, or any AI/ML service, because none of them are part of the MVP (Section 2.2). If you see a reference to these anywhere outside this document, it belongs to the full product roadmap, not this build.
