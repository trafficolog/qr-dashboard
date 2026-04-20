ALTER TABLE "api_keys"
  ADD COLUMN IF NOT EXISTS "permissions" text[] NOT NULL DEFAULT ARRAY['qr:read','qr:write','qr:stats:read']::text[],
  ADD COLUMN IF NOT EXISTS "allowed_ips" text[] NOT NULL DEFAULT ARRAY[]::text[];

UPDATE "api_keys"
SET "expires_at" = "created_at" + interval '90 days'
WHERE "expires_at" IS NULL;

ALTER TABLE "api_keys"
  ALTER COLUMN "expires_at" SET DEFAULT now() + interval '90 days',
  ALTER COLUMN "expires_at" SET NOT NULL;
