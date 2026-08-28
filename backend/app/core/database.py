from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from sqlalchemy.types import TypeDecorator, Text
from geoalchemy2 import Geometry
from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False)
async_session_maker = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
Base = declarative_base()


class PolygonGeometry(TypeDecorator):
    """
    Spatial polygon type that uses PostGIS Geometry('POLYGON', 4326) on PostgreSQL
    and Text/WKT/GeoJSON on SQLite/others without requiring SpatiaLite C extensions.
    """
    impl = Text
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(Geometry("POLYGON", srid=4326))
        return dialect.type_descriptor(Text())


async def get_db():
    async with async_session_maker() as session:
        yield session
