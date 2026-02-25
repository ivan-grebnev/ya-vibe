BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "EventLog" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "type" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'app',
  "payload" JSONB,
  "leadId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "EventLog_type_idx" ON "EventLog"("type");
CREATE INDEX IF NOT EXISTS "EventLog_leadId_idx" ON "EventLog"("leadId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'EventLog_leadId_fkey'
      AND conrelid = '"EventLog"'::regclass
  ) THEN
    ALTER TABLE "EventLog"
      ADD CONSTRAINT "EventLog_leadId_fkey"
      FOREIGN KEY ("leadId") REFERENCES "Lead"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;

COMMIT;
