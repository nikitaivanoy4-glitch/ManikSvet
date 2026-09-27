from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

# Determine if we're using PostgreSQL or SQLite
_is_postgres = "postgresql" in settings.DATABASE_URL or "postgres" in settings.DATABASE_URL

# Fix asyncpg URL scheme: postgresql:// -> postgresql+asyncpg://
_db_url = settings.DATABASE_URL
if _db_url.startswith("postgresql://"):
    _db_url = _db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif _db_url.startswith("postgres://"):
    # Railway uses postgres:// shorthand
    _db_url = _db_url.replace("postgres://", "postgresql+asyncpg://", 1)

# Engine kwargs differ between SQLite and PostgreSQL
_engine_kwargs = {}
if _is_postgres:
    _engine_kwargs = {
        "pool_size": 5,
        "max_overflow": 10,
        "pool_pre_ping": True,   # Detect stale connections
        "pool_recycle": 300,     # Recycle connections every 5 min
    }
else:
    _engine_kwargs = {
        "connect_args": {"check_same_thread": False}
    }

# Create engine
engine = create_async_engine(
    _db_url,
    echo=False,
    future=True,
    **_engine_kwargs
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
