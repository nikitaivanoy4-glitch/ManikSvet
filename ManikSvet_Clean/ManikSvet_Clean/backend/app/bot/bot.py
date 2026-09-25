import logging
import asyncio
import os
import html
from datetime import datetime, date, timedelta
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart, Command
from aiogram.types import (
    ReplyKeyboardMarkup, KeyboardButton,
    InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo, FSInputFile
)
from sqlalchemy import select, and_

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.models.booking import Booking, BookingStatus
from app.models.service import Service

logger = logging.getLogger(__name__)

bot = Bot(token=settings.TELEGRAM_BOT_TOKEN) if settings.TELEGRAM_BOT_TOKEN else None
dp = Dispatcher()

COVER_IMAGE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "static", "cover.jpg"))

def get_main_reply_keyboard(is_admin: bool = False):
    keyboard = [
        [KeyboardButton(text="✨ Записаться онлайн")],
        [
            KeyboardButton(text="💅 Услуги и Прайс"),
            KeyboardButton(text="🖼 Портфолио")
        ],
        [
            KeyboardButton(text="📅 Мои записи"),
            KeyboardButton(text="📍 Адрес и Контакты")
        ]
    ]
    if is_admin:
        keyboard.append([KeyboardButton(text="👑 Кабинет Мастера")])

    return ReplyKeyboardMarkup(keyboard=keyboard, resize_keyboard=True)

def get_client_inline_keyboard():
    url = settings.WEBAPP_URL
    if url.startswith("https://"):
        return InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="✨ Открыть Mini App Запись", web_app=WebAppInfo(url=url))]
        ])
    return None

@dp.message(CommandStart())
async def cmd_start(message: types.Message):
    is_admin = message.from_user.id in settings.ADMIN_TELEGRAM_IDS
    safe_first_name = html.escape(message.from_user.first_name or "Гость")
    
    welcome_text = (
        f"<b>Приветствуем вас в студии Маникюр Дрожжино! ✨</b>\n\n"
        f"Здравствуйте, <b>{safe_first_name}</b>!\n"
        f"Мастер Светлана рада предложить вам премиальный уход за ногтями, укрепление и эстетику.\n\n"
        f"📍 <b>Адрес:</b> М.О. Дрожжино, Новое шоссе 5к2\n"
        f"📞 <b>Телефон:</b> 89919514900\n\n"
        f"Воспользуйтесь кнопками меню ниже для записи и просмотра услуг:"
    )
    
    reply_kb = get_main_reply_keyboard(is_admin)

    # Send luxury cover photo if exists
    sent_photo = False
    if os.path.exists(COVER_IMAGE_PATH):
        try:
            photo = FSInputFile(COVER_IMAGE_PATH)
            await message.answer_photo(
                photo=photo,
                caption=welcome_text,
                parse_mode="HTML",
                reply_markup=reply_kb
            )
            sent_photo = True
        except Exception as e:
            logger.error(f"Failed to send cover photo: {e}")

    if not sent_photo:
        await message.answer(welcome_text, parse_mode="HTML", reply_markup=reply_kb)

    inline_kb = get_client_inline_keyboard()
    if inline_kb:
        await message.answer("✨ Нажмите для открытия приложения:", reply_markup=inline_kb)

@dp.message(F.text == "💅 Услуги и Прайс")
async def msg_services(message: types.Message):
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Service).where(Service.is_active == True).order_by(Service.display_order.asc()))
        services = res.scalars().all()

    text = "<b>💅 НАШИ УСЛУГИ И ПРАЙС:</b>\n\n"
    for s in services:
        text += f"▪️ <b>{html.escape(s.title)}</b>\n"
        if s.description:
            text += f"   <i>{html.escape(s.description)}</i>\n"
        text += f"   💰 <b>{s.price:,.0f} ₽</b> | ⏱ {s.duration_minutes} мин\n\n"

    await message.answer(text, parse_mode="HTML")

@dp.message(F.text == "📍 Адрес и Контакты")
async def msg_info(message: types.Message):
    text = (
        "<b>📍 СТУДИЯ МАНИКЮР ДРОЖЖИНО</b>\n\n"
        "👤 <b>Топовый мастер:</b> Светлана\n"
        "🏠 <b>Адрес:</b> М.О. Дрожжино, Новое шоссе 5к2\n"
        "📞 <b>Телефон / WhatsApp:</b> 89919514900\n"
        "💬 <b>Telegram:</b> @Manikurdrojino\n"
        "📸 <b>Instagram:</b> <a href='https://www.instagram.com/svetlana_nailsmaster_?utm_source=qr&stkn=eTlia2FjeTkxMWp1'>svetlana_nailsmaster_</a>\n\n"
        "🗺 <a href='https://yandex.ru/maps/?text=М.О.%20Дрожжино%20Новое%20шоссе%205к2'>Открыть на Яндекс.Картах</a>"
    )
    await message.answer(text, parse_mode="HTML", disable_web_page_preview=True)

@dp.message(F.text == "🖼 Портфолио")
async def msg_portfolio(message: types.Message):
    text = (
        "<b>🖼 ПОРТФОЛИО РАБОТ</b>\n\n"
        "Посмотреть лучшие работы мастера Светланы вы можете в нашем Instagram:\n"
        "👉 <a href='https://www.instagram.com/svetlana_nailsmaster_?utm_source=qr&stkn=eTlia2FjeTkxMWp1'>@svetlana_nailsmaster_</a>"
    )
    if os.path.exists(COVER_IMAGE_PATH):
        try:
            await message.answer_photo(
                photo=FSInputFile(COVER_IMAGE_PATH),
                caption=text,
                parse_mode="HTML"
            )
            return
        except Exception:
            pass
    await message.answer(text, parse_mode="HTML")

@dp.message(F.text == "✨ Записаться онлайн")
async def msg_book(message: types.Message):
    text = (
        "<b>✨ ОНЛАЙН-ЗАПИСЬ В СТУДИЮ</b>\n\n"
        "Нажмите на кнопку ниже, чтобы открыть онлайн-расписание и выбрать удобное время:"
    )
    inline_kb = get_client_inline_keyboard()
    if inline_kb:
        await message.answer(text, parse_mode="HTML", reply_markup=inline_kb)
    else:
        text_link = (
            f"<b>✨ ОНЛАЙН-ЗАПИСЬ</b>\n\n"
            f"Для записи в веб-сервисе откройте ссылку:\n"
            f"👉 <a href='{settings.WEBAPP_URL}'>Открыть сервис записи ManikSvet</a>\n\n"
            f"Или напишите мастеру Светлане напрямую: @Manikurdrojino"
        )
        await message.answer(text_link, parse_mode="HTML")

@dp.message(F.text == "📅 Мои записи")
async def msg_my_bookings(message: types.Message):
    async with AsyncSessionLocal() as db:
        res = await db.execute(
            select(Booking)
            .where(Booking.client_phone == message.from_user.username)
        )
        bookings = res.scalars().all()

    if not bookings:
        text = "<b>📅 Ваши записи:</b>\n\nУ вас пока нет активных записей. Нажмите '✨ Записаться онлайн' для выбора даты!"
    else:
        text = "<b>📅 Ваши записи:</b>\n\n"
        for b in bookings:
            text += f"▪️ {b.booking_date.strftime('%d.%m.%Y')} в {b.start_time.strftime('%H:%M')} — {b.price} ₽\n"

    await message.answer(text, parse_mode="HTML")

@dp.message(F.text == "👑 Кабинет Мастера")
@dp.message(Command("admin"))
async def cmd_admin(message: types.Message):
    if message.from_user.id not in settings.ADMIN_TELEGRAM_IDS:
        await message.answer("⛔ Доступ к админ-панели разрешен только мастеру.")
        return

    today = datetime.now().date()
    async with AsyncSessionLocal() as db:
        res = await db.execute(
            select(Booking)
            .where(
                and_(
                    Booking.booking_date == today,
                    Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.COMPLETED])
                )
            )
            .order_by(Booking.start_time.asc())
        )
        bookings = res.scalars().all()

    msg = f"<b>👑 Кабинет Мастера Светланы</b>\n\n"
    msg += f"<b>📅 Записи на сегодня ({today.strftime('%d.%m.%Y')}):</b> {len(bookings)}\n"
    total = sum(b.price for b in bookings)
    msg += f"💰 <b>Выручка сегодня: {total:,.0f} ₽</b>\n\n"

    if bookings:
        for b in bookings:
            msg += f"⏰ <b>{b.start_time.strftime('%H:%M')}</b> — {html.escape(b.client_name)} ({html.escape(b.client_phone)})\n"

    msg += f"\n🌐 <b>Открыть Web-Админку:</b> <a href='{settings.WEBAPP_URL}#admin'>Перейти в Админ-панель</a>"

    await message.answer(msg, parse_mode="HTML")
