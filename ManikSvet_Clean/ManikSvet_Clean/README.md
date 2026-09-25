# 💅 ManikSvet — Premium Beauty Booking System & Telegram Mini App

Премиальная digital-система онлайн-записи для топового мастера маникюра. Включает Telegram Mini App для клиентов, встроенного aiogram 3 бота и функциональную админ-панель мастера.

---

## 🌟 Ключевые возможности

### 📱 Клиентская часть (Telegram Mini App)
* **Роскошный дизайн Luxury Beauty**: Ивори, золотые акценты, премиальная типографика, адаптивность и плавные анимации.
* **Быстрая онлайн-запись (30-60 сек)**: Услуга → Дата → Время → Подтверждение.
* **Свободные окна**: Клиент видит только реально доступные для записи слоты.
* **Защита от двойного бронирования**: Атомарная проверка свободных окон в базе данных.
* **Личный кабинет "Мои записи"**: Просмотр предстоящих и прошлых визитов, возможность переноса и отмены в 1 клик.
* **Портфолио & Галерея**: Просмотр работ мастера по категориям с полноэкранным просмотром.
* **Информация и Локация**: Адрес, контакты, интерактивная ссылка на Яндекс.Карты.

### 👑 Кабинет Мастера (Админ-панель + Telegram Бот)
* **Дашборд**: Выручка за сегодня/месяц, число записей, свободные окна, список визитов на сегодня и завтра.
* **Управление Расписанием**: Переключение рабочих/выходных дней, установка рабочих часов и перерывов, блокировка конкретных окон.
* **Управление Записями**: Просмотр списка с фильтрацией, сброс/изменение статусов (`confirmed`, `completed`, `cancelled`).
* **База Клиентов**: История всех клиентов, общая сумма заказов, дата последнего визита, контакты.
* **Каталог Услуг и Прайс**: Добавление, редактирование цен, продолжительности, описаний и скрытие услуг.
* **Портфолио**: Публикация и удаление фотографий работ.
* **Гибкие Настройки**: Редактирование всех параметров бизнеса (название, телефон, адрес, правила отмены, время напоминаний) без доступа к коду.

---

## 🏗 Архитектура Проекта

```
ManikSvet/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI REST endpoints (v1)
│   │   │   ├── deps.py      # Telegram WebApp initData валидация и Auth
│   │   │   └── v1/          # Routers (auth, services, schedule, bookings, admin, etc.)
│   │   ├── bot/             # aiogram 3.x Telegram Bot & Admin inline handlers
│   │   ├── core/            # Config, database setup, initial seed
│   │   ├── models/          # SQLAlchemy async DB models
│   │   ├── schemas/         # Pydantic v2 validation schemas
│   │   ├── services/        # Schedule Engine & Notification dispatcher
│   │   └── main.py          # FastAPI lifespan & static files server
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/      # Client & Admin React UI components
│   │   ├── services/        # API client with Telegram headers
│   │   ├── types/           # TypeScript contracts
│   │   └── App.tsx
│   ├── index.html
│   └── vite.config.ts
├── docker-compose.yml
├── Dockerfile.backend
└── README.md
```

---

## 🚀 Быстрый запуск (Локально)

### 1. Настройка окружения Backend
В папке `backend/` скопируйте `.env.example` в `.env`:
```bash
TELEGRAM_BOT_TOKEN="ВАШ_ТОКЕН_БОТА"
ADMIN_TELEGRAM_IDS="[ВАШ_TELEGRAM_ID]"
WEBAPP_URL="http://localhost:5173"
DATABASE_URL="sqlite+aiosqlite:///./manik_svet.db"
```

Запуск виртуального окружения и сервера:
```bash
# Из корневой директории ManikSvet:
.venv\Scripts\python.exe -m uvicorn backend.app.main:app --reload --port 8000
```

Сервер автоматически:
1. Создаст SQLite базу данных `manik_svet.db`.
2. Заполнит начальный каталог услуг, настройки студии и портфолио.
3. Раздаст встроенный статичный Mini App по адресу `http://localhost:8000`.

---

## 🐳 Запуск через Docker Compose (Production)

Для разворачивания системы с PostgreSQL в продакшене:

```bash
docker-compose up -d --build
```

---

## 📱 Подключение в Telegram Bot

1. Перейдите в Telegram к [@BotFather](https://t.me/BotFather).
2. Создайте бота через `/newbot`.
3. Задайте WebApp кнопку через `/newapp` или в меню настройки бота.
4. Вставьте ссылку на развернутый WebApp (например, `https://your-domain.com`).
5. Укажите полученный токен в `.env`.

---

## 🛡 Безопасность
* Проверка подписи HMAC-SHA256 для `initData` от Telegram WebApp.
* Роли пользователей (обычный клиент / администратор по Telegram ID).
* Отсутствие секретов во frontend коде.
