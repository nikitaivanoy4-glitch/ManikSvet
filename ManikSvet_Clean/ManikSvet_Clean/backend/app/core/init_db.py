import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.service import Service
from app.models.setting import Setting
from app.models.portfolio import PortfolioItem
from app.models.user import User

logger = logging.getLogger(__name__)

async def seed_initial_data(db: AsyncSession):
    """Seed initial studio settings, services, and portfolio items if empty"""
    
    # 1. Settings for Svetlana's Salon
    default_settings = [
        ("business_name", "Маникюр Дрожжино", "Название салона/студии"),
        ("master_name", "Светлана", "Имя мастера"),
        ("tagline", "Премиальный маникюр & укрепление ногтей", "Подзаголовок"),
        ("phone", "89919514900", "Контактный телефон"),
        ("telegram", "@Manikurdrojino", "Telegram мастера"),
        ("whatsapp", "89919514900", "WhatsApp"),
        ("address", "М.О. Дрожжино, Новое шоссе 5к2", "Адрес студии"),
        ("map_link", "https://yandex.ru/maps/?text=М.О.%20Дрожжино%20Новое%20шоссе%205к2", "Ссылка на карту"),
        ("instagram", "https://www.instagram.com/svetlana_nailsmaster_?utm_source=qr&stkn=eTlia2FjeTkxMWp1", "Instagram мастера"),
        ("reminder_hours", "24,2", "Часы до отправки напоминаний (через запятую)"),
        ("min_advance_hours", "2", "Минимальное время до записи (часы)"),
        ("max_advance_days", "30", "Максимальный горизонт записи (дни)"),
        ("slot_interval_minutes", "30", "Шаг сетки расписания (минуты)"),
        ("currency", "₽", "Валюта"),
        ("welcome_text", "Добро пожаловать в студию Маникюр Дрожжино! С удовольствием подарю вашим ногтям идеальный уход и эстетику.", "Приветствие")
    ]
    
    for key, val, desc in default_settings:
        res = await db.execute(select(Setting).where(Setting.key == key))
        setting_obj = res.scalar_one_or_none()
        if not setting_obj:
            db.add(Setting(key=key, value=val, description=desc))
        else:
            # Update existing to match user request
            setting_obj.value = val

    # 2. Seed Svetlana's Services
    res_services = await db.execute(select(Service))
    existing_services = res_services.scalars().all()
    if not existing_services:
        initial_services = [
            Service(
                title="Комплекс: Маникюр + Укрепление + Однотонное покрытие",
                description="Снятие старого материала, аккуратный комбинированный маникюр, укрепление ногтевой пластины и идеальное однотонное покрытие.",
                price=2800.0,
                duration_minutes=105,
                image_url="https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80",
                is_active=True,
                display_order=1
            ),
            Service(
                title="Дизайн Френч (+к услуге)",
                description="Элегантная тончайшая улыбка на все ногти (френч). Дополняет основной комплекс.",
                price=500.0,
                duration_minutes=30,
                image_url="https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=800&q=80",
                is_active=True,
                display_order=2
            ),
            Service(
                title="Наращивание ногтей",
                description="Моделирование идеальной формы и длины ногтей с укреплением и однотонным покрытием.",
                price=3500.0,
                duration_minutes=120,
                image_url="https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=800&q=80",
                is_active=True,
                display_order=3
            )
        ]
        db.add_all(initial_services)

    # 3. Seed Portfolio items
    res_portfolio = await db.execute(select(PortfolioItem))
    if not res_portfolio.scalars().all():
        initial_portfolio = [
            PortfolioItem(
                title="Комплекс с укреплением & Минимализм",
                description="Аккуратная миндальная форма и бежевый эстетичный оттенок.",
                category="Укрепление & Покрытие",
                image_url="https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80",
                is_visible=True,
                display_order=1
            ),
            PortfolioItem(
                title="Утонченный классический френч",
                description="Идеальный бежево-белый французский маникюр.",
                category="Френч",
                image_url="https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=800&q=80",
                is_visible=True,
                display_order=2
            ),
            PortfolioItem(
                title="Наращивание ногтей четкий квадрат",
                description="Моделирование длины с однотонным сатиновым финишем.",
                category="Наращивание",
                image_url="https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=800&q=80",
                is_visible=True,
                display_order=3
            )
        ]
        db.add_all(initial_portfolio)

    # 4. Grant Admin rights to Svetlana's Telegram ID (708192421)
    res_user = await db.execute(select(User).where(User.telegram_id == 708192421))
    admin_user = res_user.scalar_one_or_none()
    if admin_user:
        admin_user.is_admin = True
    else:
        db.add(User(
            telegram_id=708192421,
            first_name="Светлана",
            username="Manikurdrojino",
            phone="89919514900",
            is_admin=True
        ))

    await db.commit()
    logger.info("Database initial seeding complete for Svetlana's salon.")
