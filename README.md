# Vibecoding Landing App

Frontend+backend приложение лендинга предрегистрации на курс «Вайбкодинг» на TypeScript с API сохранения лидов в Postgres через Prisma.

## Что внутри

- `src/client.ts` - frontend-рендер лендинга и отправка формы в API
- `src/server.ts` - express-сервер и маршрут `POST /api/leads`
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

## Локальный запуск без Docker (опционально)

Нужен локальный Postgres и переменная окружения `DB_URL`.

```bash
npm install
npm run build
npm run prisma:push
npm start
```
