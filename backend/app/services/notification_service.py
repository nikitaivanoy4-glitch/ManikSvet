import logging
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.models.notification import NotificationLog
from app.models.booking import Booking

logger = logging.getLogger(__name__)

class NotificationService:
    @staticmethod
    async def send_telegram_message(bot, chat_id: int, text: str, reply_markup=None) -> bool:
        """Helper to safely send telegram messages"""
        if not bot:
            logger.warning("Bot instance not available, skipping message delivery")
            return False
        try:
            await bot.send_message(chat_id=chat_id, text=text, parse_mode="HTML", reply_markup=reply_markup)
            return True
        except Exception as e:
            logger.error(f"Failed to send Telegram message to {chat_id}: {e}")
            return False

    @staticmethod
    async def notify_new_booking(db: AsyncSession, bot, booking: Booking, master_telegram_ids: list[int]):
        """Notify master about a new booking"""
        date_str = booking.booking_date.strftime("%d.%m.%Y")
        start_str = booking.start_time.strftime("%H:%M")
        service_title = booking.service.title if booking.service else "Услуга"
        price_str = f"{booking.price:,.0f} ₽".replace(",", " ")

        msg = (
            f"<b>✨ НОВАЯ ЗАПИСЬ!</b>\n\n"
            f"👤 <b>Клиент:</b> {booking.client_name}\n"
            f"📞 <b>Телефон:</b> {booking.client_phone}\n"
            f"💅 <b>Услуга:</b> {service_title}\n"
            f"📅 <b>Дата:</b> {date_str}\n"
            f"⏰ <b>Время:</b> {start_str}\n"
            f"💳 <b>Стоимость:</b> {price_str}\n"
        )
        if booking.notes:
            msg += f"💬 <b>Комментарий:</b> {booking.notes}\n"

        for admin_id in master_telegram_ids:
            sent = await NotificationService.send_telegram_message(bot, admin_id, msg)
            log = NotificationLog(
                telegram_id=admin_id,
                booking_id=booking.id,
                notification_type="new_booking_master",
                message=msg,
                status="sent" if sent else "failed"
            )
            db.add(log)
        await db.commit()

    @staticmethod
    async def notify_booking_cancellation(db: AsyncSession, bot, booking: Booking, master_telegram_ids: list[int], cancelled_by_client: bool = True):
        """Notify master & client about booking cancellation"""
        date_str = booking.booking_date.strftime("%d.%m.%Y")
        start_str = booking.start_time.strftime("%H:%M")
        service_title = booking.service.title if booking.service else "Услуга"

        # Master notification
        master_msg = (
            f"<b>❌ ЗАПИСЬ ОТМЕНЕНА</b>\n\n"
            f"👤 <b>Клиент:</b> {booking.client_name} ({booking.client_phone})\n"
            f"💅 <b>Услуга:</b> {service_title}\n"
            f"📅 <b>Дата:</b> {date_str} в {start_str}\n"
            f"⚠️ <i>Окно снова свободно для записи.</i>"
        )
        for admin_id in master_telegram_ids:
            await NotificationService.send_telegram_message(bot, admin_id, master_msg)

        # Client notification
        if booking.user and booking.user.telegram_id:
            client_msg = (
                f"<b>❌ Ваша запись отменена</b>\n\n"
                f"Услуга: <b>{service_title}</b>\n"
                f"Дата: <b>{date_str} в {start_str}</b>\n\n"
                f"Вы всегда можете выбрать новое удобное время в нашем сервисе."
            )
            sent = await NotificationService.send_telegram_message(bot, booking.user.telegram_id, client_msg)
            log = NotificationLog(
                telegram_id=booking.user.telegram_id,
                booking_id=booking.id,
                notification_type="cancellation_client",
                message=client_msg,
                status="sent" if sent else "failed"
            )
            db.add(log)
            await db.commit()

    @staticmethod
    async def notify_booking_reschedule(db: AsyncSession, bot, booking: Booking, old_date, old_time, master_telegram_ids: list[int]):
        """Notify master & client about rescheduled booking"""
        new_date_str = booking.booking_date.strftime("%d.%m.%Y")
        new_start_str = booking.start_time.strftime("%H:%M")
        old_date_str = old_date.strftime("%d.%m.%Y")
        old_start_str = old_time.strftime("%H:%M")
        service_title = booking.service.title if booking.service else "Услуга"

        master_msg = (
            f"<b>🔄 ЗАПИСЬ ПЕРЕНЕСЕНА</b>\n\n"
            f"👤 <b>Клиент:</b> {booking.client_name}\n"
            f"💅 <b>Услуга:</b> {service_title}\n"
            f"Старая дата: {old_date_str} {old_start_str}\n"
            f"✨ <b>Новая дата:</b> {new_date_str} в {new_start_str}"
        )
        for admin_id in master_telegram_ids:
            await NotificationService.send_telegram_message(bot, admin_id, master_msg)

        if booking.user and booking.user.telegram_id:
            client_msg = (
                f"<b>🔄 Ваша запись успешно перенесена!</b>\n\n"
                f"Услуга: <b>{service_title}</b>\n"
                f"Новое время: <b>{new_date_str} в {new_start_str}</b>\n"
                f"Ждем вас в назначенное время!"
            )
            sent = await NotificationService.send_telegram_message(bot, booking.user.telegram_id, client_msg)
            log = NotificationLog(
                telegram_id=booking.user.telegram_id,
                booking_id=booking.id,
                notification_type="reschedule_client",
                message=client_msg,
                status="sent" if sent else "failed"
            )
            db.add(log)
            await db.commit()
