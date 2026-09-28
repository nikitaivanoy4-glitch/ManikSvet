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
from app.models.user import User

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
            KeyboardButton(text="⭐ Отзывы")
        ],
        [
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
    try:
        is_admin = message.from_user.id in settings.ADMIN_TELEGRAM_IDS
        safe_first_name = html.escape(message.from_user.first_name or "Гость")
        
        welcome_text = (
            f"<b>Добро пожаловать! ✨</b>\n\n"
            f"Здравствуйте, <b>{safe_first_name}</b>!\n"
            f"Мастер Светлана рада предложить вам премиальный уход за ногтями, укрепление и эстетику.\n\n"
            f"📍 <b>Адрес:</b> М.О. Дрожжино, Новое шоссе 5к2\n"
            f"📞 <b>Телефон:</b> 89919514900\n\n"
            f"Воспользуйтесь кнопками меню ниже для записи и просмотра услуг:"
        )
        
        reply_kb = get_main_reply_keyboard(is_admin)

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
    except Exception as e:
        logger.error(f"Error in cmd_start: {e}", exc_info=True)

@dp.message(F.text, F.text.contains("Услуги"))
@dp.message(F.text, F.text.contains("Прайс"))
async def msg_services(message: types.Message):
    try:
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
    except Exception as e:
        logger.error(f"Error in msg_services: {e}", exc_info=True)
        await message.answer("💅 <b>Наши услуги:</b>\n• Комплекс (маникюр + укрепление + покрытие) — 2800 ₽\n• Френч — 500 ₽\n• Наращивание — 3500 ₽", parse_mode="HTML")

@dp.message(F.text, F.text.contains("Адрес"))
@dp.message(F.text, F.text.contains("Контакты"))
async def msg_info(message: types.Message):
    try:
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
    except Exception as e:
        logger.error(f"Error in msg_info: {e}", exc_info=True)

@dp.message(F.text, F.text.contains("Портфолио"))
@dp.message(F.text, F.text.contains("Работы"))
async def msg_portfolio(message: types.Message):
    try:
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
    except Exception as e:
        logger.error(f"Error in msg_portfolio: {e}", exc_info=True)

@dp.message(F.text, F.text.contains("Записаться"))
@dp.message(F.text, F.text.contains("Запись"))
@dp.message(F.text, F.text.contains("Онлайн"))
async def msg_book(message: types.Message):
    try:
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
    except Exception as e:
        logger.error(f"Error in msg_book: {e}", exc_info=True)

@dp.message(F.text, F.text.contains("Мои записи"))
@dp.message(F.text, F.text.contains("Моя запись"))
async def msg_my_bookings(message: types.Message):
    try:
        async with AsyncSessionLocal() as db:
            user_res = await db.execute(
                select(User).where(User.telegram_id == message.from_user.id)
            )
            user = user_res.scalar_one_or_none()

            bookings = []
            if user:
                res = await db.execute(
                    select(Booking)
                    .where(
                        and_(
                            Booking.user_id == user.id,
                            Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.COMPLETED])
                        )
                    )
                    .order_by(Booking.booking_date.asc(), Booking.start_time.asc())
                )
                bookings = res.scalars().all()

        if not bookings:
            text = "<b>📅 Ваши записи:</b>\n\nУ вас пока нет активных записей. Нажмите '✨ Записаться онлайн' для выбора даты!"
        else:
            text = "<b>📅 Ваши записи:</b>\n\n"
            for b in bookings:
                status_icon = "✅" if b.status == BookingStatus.CONFIRMED else "🏁"
                text += f"{status_icon} <b>{b.booking_date.strftime('%d.%m.%Y')}</b> в <b>{b.start_time.strftime('%H:%M')}</b> — {b.price:,.0f} ₽\n"

        await message.answer(text, parse_mode="HTML")
    except Exception as e:
        logger.error(f"Error in msg_my_bookings: {e}", exc_info=True)
        await message.answer("📅 <b>Ваши записи:</b>\nНажмите 'Записаться онлайн' для управления записями в приложении.")

@dp.message(F.text, F.text.contains("Отзыв"))
async def msg_reviews(message: types.Message):
    try:
        url = settings.WEBAPP_URL.rstrip('/') + "#reviews"
        text = (
            "<b>⭐ ОТЗЫВЫ НАШИХ КЛИЕНТОВ</b>\n\n"
            "Мы очень ценим ваше мнение и стараемся быть лучше с каждым днём!\n\n"
            "Вы можете прочитать отзывы клиентов или оставить свой отзыв через наше мини-приложение:"
        )
        inline_kb = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="⭐ Открыть отзывы / Оставить отзыв", web_app=WebAppInfo(url=url))]
        ]) if settings.WEBAPP_URL.startswith("https://") else None

        if inline_kb:
            await message.answer(text, parse_mode="HTML", reply_markup=inline_kb)
        else:
            await message.answer(f"{text}\n\n👉 <a href='{url}'>Перейти к отзывам</a>", parse_mode="HTML")
    except Exception as e:
        logger.error(f"Error in msg_reviews: {e}", exc_info=True)

@dp.message(Command("admin"))
@dp.message(F.text, F.text.contains("Кабинет"))
@dp.message(F.text, F.text.contains("Мастера"))
async def cmd_admin(message: types.Message):
    try:
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
    except Exception as e:
        logger.error(f"Error in cmd_admin: {e}", exc_info=True)

# Fallback for any other message: show start menu & main keyboard
@dp.message()
async def fallback_handler(message: types.Message):
    try:
        is_admin = message.from_user.id in settings.ADMIN_TELEGRAM_IDS
        reply_kb = get_main_reply_keyboard(is_admin)
        inline_kb = get_client_inline_keyboard()
        
        msg_text = "Выберите нужное действие из меню ниже:"
        await message.answer(msg_text, reply_markup=reply_kb)
        if inline_kb:
            await message.answer("✨ Нажмите для открытия онлайн-записи:", reply_markup=inline_kb)
    except Exception as e:
        logger.error(f"Error in fallback_handler: {e}", exc_info=True)
