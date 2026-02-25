#!/bin/sh
set -eu

generate_uuid() {
  node -e "console.log(require('node:crypto').randomUUID())"
}

LEAD_ID="${1:-$(generate_uuid)}"
EVENT_ID="${2:-$(generate_uuid)}"
WEBHOOK_SECRET="${WEBHOOK_SECRET:-dev_webhook_secret}"

curl -sS -X POST "http://localhost:3000/api/webhook/payment" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: ${WEBHOOK_SECRET}" \
  -d "{\"event_id\":\"${EVENT_ID}\",\"event_type\":\"payment_succeeded\",\"data\":{\"lead_id\":\"${LEAD_ID}\",\"amount\":19900,\"currency\":\"RUB\"}}"

echo
