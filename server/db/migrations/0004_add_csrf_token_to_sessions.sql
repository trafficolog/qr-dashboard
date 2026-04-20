ALTER TABLE "sessions" ADD COLUMN "csrf_token" varchar(255);

UPDATE "sessions" SET "csrf_token" = md5(random()::text || clock_timestamp()::text) WHERE "csrf_token" IS NULL;

ALTER TABLE "sessions" ALTER COLUMN "csrf_token" SET NOT NULL;
