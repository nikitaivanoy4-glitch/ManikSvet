import asyncio
from app.core.database import engine, Base, AsyncSessionLocal
from app.core.init_db import seed_initial_data

async def main():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with AsyncSessionLocal() as db:
        await seed_initial_data(db)
    print("Database successfully seeded for Svetlana's salon (Маникюр Дрожжино)!")

if __name__ == "__main__":
    asyncio.run(main())
