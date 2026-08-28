import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.main import app
from app.core.database import Base, get_db
from app.core.config import settings
from app.modules.auth.models import User, RoleEnum, Agency
from app.core.security import get_password_hash, create_access_token
import uuid

# In-memory SQLite async database for testing
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="function")
async def test_db():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with session_factory() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()

@pytest.fixture(scope="function")
async def client(test_db):
    async def override_get_db():
        yield test_db

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()

@pytest.fixture
async def seed_users(test_db):
    users = {}
    roles = [
        RoleEnum.CENTRAL_ADMIN,
        RoleEnum.STATE_ADMIN,
        RoleEnum.DISTRICT_AUTHORITY,
        RoleEnum.PROJECT_AGENCY,
        RoleEnum.FIELD_OFFICER,
        RoleEnum.AUDITOR,
        RoleEnum.VIEWER,
    ]
    for role in roles:
        u = User(
            id=uuid.uuid4(),
            name=f"Test {role.value}",
            email=f"{role.value.lower()}@test.gov.in",
            password_hash=get_password_hash("Password123!"),
            role=role,
            state_scope="Maharashtra" if role in [RoleEnum.STATE_ADMIN, RoleEnum.DISTRICT_AUTHORITY] else None,
            district_scope="Pune" if role == RoleEnum.DISTRICT_AUTHORITY else None,
            is_active=True,
        )
        test_db.add(u)
        users[role] = u

    # Also seed test agency
    agency = Agency(id=uuid.uuid4(), name="National Highways Authority", type="implementing_agency")
    test_db.add(agency)
    await test_db.commit()

    tokens = {
        role: create_access_token({"sub": str(users[role].id)})
        for role in roles
    }
    return {"users": users, "tokens": tokens, "agency": agency}
