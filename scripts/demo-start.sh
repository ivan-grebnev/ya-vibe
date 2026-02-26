#!/bin/sh
set -eu

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"
ENV_EXAMPLE_FILE="${ROOT_DIR}/.env.example"
TG_TOKEN_ARG=""
DEMO_WEBHOOK_SECRET="demo_webhook_secret"

usage() {
  cat <<'USAGE'
Usage:
  scripts/demo-start.sh [--tg-token <token>]

Options:
  --tg-token <token>  Optional Telegram bot token. If passed, script fetches chat.id
                      via getUpdates and writes TG_TOKEN/TG_CHAT_ID into .env.
USAGE
}

while [ $# -gt 0 ]; do
  case "$1" in
    --tg-token)
      if [ $# -lt 2 ]; then
        echo "Error: --tg-token requires a value"
        exit 1
      fi
      TG_TOKEN_ARG="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Error: unknown argument '$1'"
      usage
      exit 1
      ;;
esac
done

if [ ! -f "${ENV_EXAMPLE_FILE}" ]; then
  echo "Error: ${ENV_EXAMPLE_FILE} not found"
  exit 1
fi

update_env_var() {
  key="$1"
  value="$2"
  if grep -q "^${key}=" "${ENV_FILE}"; then
    sed -i.bak "s|^${key}=.*|${key}=${value}|" "${ENV_FILE}"
    rm -f "${ENV_FILE}.bak"
  else
    echo "${key}=${value}" >> "${ENV_FILE}"
  fi
}

wait_for_db() {
  retries=60
  i=0
  while [ $i -lt $retries ]; do
    if docker compose exec -T db pg_isready -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" >/dev/null 2>&1; then
      return 0
    fi
    i=$((i + 1))
    sleep 1
  done
  echo "Error: db is not ready"
  return 1
}

wait_for_app() {
  retries=90
  i=0
  while [ $i -lt $retries ]; do
    if curl -fsS "http://localhost:${PORT}/health" >/dev/null 2>&1; then
      return 0
    fi
    i=$((i + 1))
    sleep 1
  done
  echo "Error: app is not ready"
  return 1
}

assert_contains() {
  text="$1"
  expected="$2"
  context="$3"
  case "${text}" in
    *"${expected}"*) ;;
    *)
    echo "Error: ${context}. Expected to find '${expected}', got: ${text}"
    exit 1
    ;;
  esac
}

assert_count_ge_1() {
  value="$1"
  name="$2"
  case "$value" in
    ''|*[!0-9]*)
      echo "Error: invalid numeric value for ${name}: ${value}"
      exit 1
      ;;
  esac
  if [ "$value" -lt 1 ]; then
    echo "Error: ${name} event not found"
    exit 1
  fi
}

echo "Preparing .env from .env.example"
cp "${ENV_EXAMPLE_FILE}" "${ENV_FILE}"
update_env_var "WEBHOOK_SECRET" "${DEMO_WEBHOOK_SECRET}"
update_env_var "TG_TOKEN" ""
update_env_var "TG_CHAT_ID" ""

if [ -n "${TG_TOKEN_ARG}" ]; then
  update_env_var "TG_TOKEN" "${TG_TOKEN_ARG}"
fi

set -a
. "${ENV_FILE}"
set +a

echo "Starting containers (db, app) in detached mode"
docker compose up -d --build db app

echo "Waiting for db"
wait_for_db
echo "Waiting for app"
wait_for_app

if [ -n "${TG_TOKEN_ARG}" ]; then
  echo "Fetching Telegram chat.id via getUpdates"
  updates_json="$(curl -fsS "https://api.telegram.org/bot${TG_TOKEN_ARG}/getUpdates")"
  tg_chat_id="$(printf '%s' "${updates_json}" | sed -n 's/.*"chat":{"id":\([-0-9]*\).*/\1/p' | head -n 1)"
  if [ -z "${tg_chat_id}" ]; then
    echo "Error: could not extract chat.id from getUpdates response. Send a message to the bot and rerun."
    exit 1
  fi

  update_env_var "TG_CHAT_ID" "${tg_chat_id}"
  echo "TG_CHAT_ID=${tg_chat_id} written to .env, restarting app to apply"
  docker compose up -d --build app
  wait_for_app
fi

echo "Running seed"
docker compose exec -T app npm run db:seed >/dev/null

echo "Checking landing_view"
curl -fsS "http://localhost:${PORT}/" >/dev/null
landing_count="$(docker compose exec -T db psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -Atc "SELECT COUNT(*) FROM \"EventLog\" WHERE \"type\"='landing_view';" | tr -d '\r')"
assert_count_ge_1 "${landing_count}" "landing_view"

echo "Checking cta_click and lead_created"
phone_suffix="$(date +%s)"
lead_response="$(curl -fsS -X POST "http://localhost:${PORT}/api/leads" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Demo User\",\"phone\":\"+799900${phone_suffix}\"}")"

lead_id="$(printf '%s' "${lead_response}" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -n 1)"
if [ -z "${lead_id}" ]; then
  echo "Error: failed to parse lead id from /api/leads response"
  exit 1
fi

cta_count="$(docker compose exec -T db psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -Atc "SELECT COUNT(*) FROM \"EventLog\" WHERE \"type\"='cta_click';" | tr -d '\r')"
lead_created_count="$(docker compose exec -T db psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -Atc "SELECT COUNT(*) FROM \"EventLog\" WHERE \"type\"='lead_created';" | tr -d '\r')"
assert_count_ge_1 "${cta_count}" "cta_click"
assert_count_ge_1 "${lead_created_count}" "lead_created"

echo "Checking webhook combinations for lead_id/event_id"
event_id_a="$(uuidgen | tr '[:upper:]' '[:lower:]')"
event_id_b="$(uuidgen | tr '[:upper:]' '[:lower:]')"
event_id_c="$(uuidgen | tr '[:upper:]' '[:lower:]')"

# both lead_id + event_id
resp_a="$(curl -fsS -X POST "http://localhost:${PORT}/api/webhook/payment" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: ${DEMO_WEBHOOK_SECRET}" \
  -d "{\"event_id\":\"${event_id_a}\",\"event_type\":\"payment_succeeded\",\"data\":{\"lead_id\":\"${lead_id}\",\"amount\":19900,\"currency\":\"RUB\"}}")"
assert_contains "${resp_a}" "\"status\":\"ok\"" "webhook case both lead_id+event_id failed"

# only event_id (no lead_id)
resp_b="$(curl -fsS -X POST "http://localhost:${PORT}/api/webhook/payment" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: ${DEMO_WEBHOOK_SECRET}" \
  -d "{\"event_id\":\"${event_id_b}\",\"event_type\":\"payment_succeeded\",\"data\":{\"amount\":19900,\"currency\":\"RUB\"}}")"
assert_contains "${resp_b}" "\"status\":\"ok\"" "webhook case only event_id failed"

# only lead_id (missing event_id)
resp_c="$(curl -sS -X POST "http://localhost:${PORT}/api/webhook/payment" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: ${DEMO_WEBHOOK_SECRET}" \
  -d "{\"event_type\":\"payment_succeeded\",\"data\":{\"lead_id\":\"${lead_id}\",\"amount\":19900,\"currency\":\"RUB\"}}")"
assert_contains "${resp_c}" "event_id and event_type are required" "webhook case only lead_id failed"

# neither lead_id nor event_id
resp_d="$(curl -sS -X POST "http://localhost:${PORT}/api/webhook/payment" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: ${DEMO_WEBHOOK_SECRET}" \
  -d "{\"event_type\":\"payment_succeeded\",\"data\":{\"amount\":19900,\"currency\":\"RUB\"}}")"
assert_contains "${resp_d}" "event_id and event_type are required" "webhook case neither lead_id nor event_id failed"

# duplicate event_id
resp_e="$(curl -fsS -X POST "http://localhost:${PORT}/api/webhook/payment" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: ${DEMO_WEBHOOK_SECRET}" \
  -d "{\"event_id\":\"${event_id_a}\",\"event_type\":\"payment_succeeded\",\"data\":{\"lead_id\":\"${lead_id}\",\"amount\":19900,\"currency\":\"RUB\"}}")"
assert_contains "${resp_e}" "\"status\":\"duplicate_ignored\"" "webhook duplicate event_id failed"

# invalid secret
resp_f="$(curl -sS -X POST "http://localhost:${PORT}/api/webhook/payment" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: wrong_secret" \
  -d "{\"event_id\":\"${event_id_c}\",\"event_type\":\"payment_succeeded\",\"data\":{\"lead_id\":\"${lead_id}\",\"amount\":19900,\"currency\":\"RUB\"}}")"
assert_contains "${resp_f}" "unauthorized" "webhook invalid secret failed"

echo "Demo run completed successfully"
