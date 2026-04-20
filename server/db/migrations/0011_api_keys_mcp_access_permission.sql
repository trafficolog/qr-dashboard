ALTER TABLE "api_keys"
  ALTER COLUMN "permissions" SET DEFAULT ARRAY['qr:read','qr:write','qr:stats:read','mcp:access']::text[];

UPDATE "api_keys"
SET "permissions" = (
  WITH normalized AS (
    SELECT ARRAY(
      SELECT DISTINCT permission
      FROM unnest(COALESCE("permissions", ARRAY[]::text[])) AS permission
      WHERE permission IN ('qr:read', 'qr:write', 'qr:stats:read', 'mcp:access')
      ORDER BY permission
    ) AS allowed
  )
  SELECT CASE
    WHEN array_length(normalized.allowed, 1) IS NULL THEN ARRAY['qr:read','qr:write','qr:stats:read']::text[]
    ELSE normalized.allowed
  END
  FROM normalized
)
WHERE "permissions" IS NULL
   OR array_length("permissions", 1) IS NULL
   OR EXISTS (
     SELECT 1
     FROM unnest("permissions") AS permission
     WHERE permission NOT IN ('qr:read', 'qr:write', 'qr:stats:read', 'mcp:access')
   );
