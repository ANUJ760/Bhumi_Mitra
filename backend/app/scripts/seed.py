import asyncio
import uuid
import secrets
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.core.config import settings
from app.modules.auth.models import User, RoleEnum, Agency
from app.core.security import get_password_hash
from sqlalchemy import select

async def seed():
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    async with async_session() as db:
        # Check if admin exists
        res = await db.execute(select(User).where(User.email == 'admin@bhumimitra.gov.in'))
        admin = res.scalar_one_or_none()
        
        if not admin:
            pwd = secrets.token_urlsafe(12)
            admin = User(
                name="Central Admin",
                email="admin@bhumimitra.gov.in",
                password_hash=get_password_hash(pwd),
                role=RoleEnum.CENTRAL_ADMIN
            )
            db.add(admin)
            await db.commit()
            print(f"Created Admin - Email: admin@bhumimitra.gov.in, Password: {pwd}")
        else:
            print("Admin already exists.")

        # Create Agencies
        agencies = ["Ministry of Road Transport", "Maharashtra PWD", "Pune District Office", "NHAI"]
        for a_name in agencies:
            res = await db.execute(select(Agency).where(Agency.name == a_name))
            if not res.scalar_one_or_none():
                db.add(Agency(name=a_name, type="GOVERNMENT"))
        
        await db.commit()
        print("Agencies seeded.")

if __name__ == "__main__":
    asyncio.run(seed())
