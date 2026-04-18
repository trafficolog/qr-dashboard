DO $$ BEGIN
  CREATE TYPE "public"."qr_visibility" AS ENUM('private', 'public', 'department');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."user_department_role" AS ENUM('member', 'head');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "qr_codes"
  ADD COLUMN IF NOT EXISTS "visibility" "qr_visibility" NOT NULL DEFAULT 'private',
  ADD COLUMN IF NOT EXISTS "department_id" uuid;

CREATE TABLE IF NOT EXISTS "user_departments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "department_id" uuid NOT NULL,
  "role" "user_department_role" DEFAULT 'member' NOT NULL,
  CONSTRAINT "user_department_user_department_unique" UNIQUE("user_id", "department_id")
);

DO $$ BEGIN
  ALTER TABLE "user_departments"
    ADD CONSTRAINT "user_departments_user_id_users_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
      ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "qr_visibility_idx" ON "qr_codes" USING btree ("visibility");
CREATE INDEX IF NOT EXISTS "qr_department_id_idx" ON "qr_codes" USING btree ("department_id");
CREATE INDEX IF NOT EXISTS "user_department_user_id_idx" ON "user_departments" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "user_department_department_id_idx" ON "user_departments" USING btree ("department_id");
