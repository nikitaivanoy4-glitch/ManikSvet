import asyncio
from app.bot.bot import bot

async def main():
    if bot:
        me = await bot.get_me()
        print(f"SUCCESS: Bot active on Telegram! Username: @{me.username}, ID: {me.id}, Name: {me.first_name}")
        await bot.session.close()

if __name__ == "__main__":
    asyncio.run(main())
