# Vibecoding Landing App

Frontend+backend приложение лендинга предрегистрации на курс «Вайбкодинг» на TypeScript с API сохранения лидов и событий в Postgres через Prisma.

## Что внутри

- `src/client.ts` - frontend-рендер лендинга и отправка формы в API
- `src/server.ts` - express-сервер, маршруты `POST /api/leads` и `POST /api/webhook/payment`
- `src/prisma.ts` - singleton Prisma Client
- `prisma/schema.prisma` - схема БД (модель `Lead`)
- `public/index.html` - HTML-точка входа
- `public/styles.css` - стили лендинга
- `docker-compose.yml` - контейнеры `app` и `db`

## Запуск через Docker Compose

1. Собрать и запустить контейнеры:

```bash
docker compose up --build
```

2. Открыть лендинг:

```text
http://localhost:3000
```

3. Проверка health:

```text
http://localhost:3000/health
```

4. Остановить контейнеры:

```bash
docker compose down
```

Postgres хранит данные в volume `postgres_data`.

В сервис `app` в `docker-compose.yml` добавлена переменная:

- `WEBHOOK_SECRET=dev_webhook_secret` (секрет для внешнего webhook)
- `TG_TOKEN` (токен Telegram-бота)
- `TG_CHAT_ID` (chat id получателя сообщений)

Для получения `TG_CHAT_ID`:

1. Написать любое сообщение боту в Telegram.
2. Выполнить:

```bash
curl "https://api.telegram.org/bot<TG_TOKEN>/getUpdates"
```

3. В ответе взять `result[].message.chat.id` и записать в `TG_CHAT_ID`.

## Демо-запуск

Команда полного демо-сценария:

```bash
sh scripts/demo-start.sh
```

Что делает команда:

- копирует `.env.example` в `.env`
- проставляет demo-значение `WEBHOOK_SECRET=demo_webhook_secret`
- поднимает только контейнеры `db` и `app` в detached-режиме
- выполняет `seed` таблицы `Lead`
- проверяет события `landing_view`, `cta_click`, `lead_created`
- проверяет webhook-кейсы по сочетаниям `lead_id` и `event_id`, дубликат `event_id` и неверный секрет

Опционально можно передать токен Telegram-бота:

```bash
sh scripts/demo-start.sh --tg-token <TG_TOKEN>
```

Тогда после запуска окружения команда вызовет `getUpdates`, извлечет `chat.id`, заполнит `TG_TOKEN` и `TG_CHAT_ID` в `.env` и перезапустит `app`.

## API

### POST `/api/leads`

Тело запроса:

```json
{
  "name": "Иван",
  "phone": "+79991234567"
}
```

Правила:

- `name` и `phone` обязательны
- `phone` должен начинаться с `+` и содержать только цифры
- дубликат `phone` возвращает `409 duplicate contact`
- при успешном создании лида пишется событие `lead_created` в `EventLog` и отправляется уведомление в Telegram

### POST `/api/webhook/payment`

Назначение:

- прием внешних событий оплаты
- сохранение события в `EventLog` с `source="payment_service"`

Заголовок:

- `X-Webhook-Secret` должен быть равен значению `WEBHOOK_SECRET`

Тело запроса:

```json
{
  "event_id": "7d1539b5-0a89-43ef-a993-17742df22390",
  "event_type": "payment_succeeded",
  "data": {
    "lead_id": "be9ed467-044e-425b-bbfa-b0f317b72ee8",
    "amount": 19900,
    "currency": "RUB"
  }
}
```

Поведение:

- если секрет неверный: `401 {"error":"unauthorized"}`
- если событие новое: `200 {"status":"ok"}`
- если `event_id` уже существует в `EventLog`: `200 {"status":"duplicate_ignored"}`
- `leadId` в `EventLog` заполняется, если `data.lead_id` передан и существует в таблице `Lead`

## Seed тестовых данных

Команда seed создает 5 случайных записей в таблице `Lead`.

Условия:

- `phone` генерируется в формате `+` и далее только цифры
- учитывается уникальность `phone` относительно уже существующих записей

Запуск через Docker Compose:

```bash
docker compose exec app npm run db:seed
```

## Имитация webhook оплаты

Добавлена команда:

```bash
docker compose exec app npm run webhook:payment:simulate -- [lead_id] [event_id]
```

Параметры:

- `lead_id` (необязательно): если не указан, генерируется случайный UUID
- `event_id` (необязательно): если не указан, генерируется случайный UUID

Примеры:

```bash
# Оба параметра сгенерируются автоматически
docker compose exec app npm run webhook:payment:simulate

# Передать конкретный lead_id
docker compose exec app npm run webhook:payment:simulate -- be9ed467-044e-425b-bbfa-b0f317b72ee8

# Передать lead_id и event_id
docker compose exec app npm run webhook:payment:simulate -- be9ed467-044e-425b-bbfa-b0f317b72ee8 7d1539b5-0a89-43ef-a993-17742df22390
```

При необходимости можно переопределить секрет при запуске команды:

```bash
docker compose exec -e WEBHOOK_SECRET=dev_webhook_secret app npm run webhook:payment:simulate
```
