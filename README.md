# Vibecoding Landing App

Frontend-приложение лендинга предрегистрации на курс «Вайбкодинг» на TypeScript, с локальным запуском в Docker-контейнере (Node.js + Express).

## Что внутри

- `src/client.ts` - frontend-логика и рендер контента лендинга
- `src/server.ts` - express-сервер
- `public/index.html` - HTML-точка входа
- `public/styles.css` - стили лендинга
- `docker-compose.yml` - запуск приложения в контейнере `app`

## Запуск через Docker Compose

1. Собрать и запустить контейнер:

```bash
docker compose up --build
```

2. Открыть в браузере:

```text
http://localhost:3000
```

3. Остановить контейнер:

```bash
docker compose down
```

## Локальный запуск без Docker (опционально)

```bash
npm install
npm run build
npm start
```

После запуска приложение также доступно на `http://localhost:3000`.
