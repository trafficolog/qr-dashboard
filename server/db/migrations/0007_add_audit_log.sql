CREATE TYPE "audit_action" AS ENUM(
  'auth.verify',
  'auth.logout',
  'qr.create',
  'qr.update',
  'qr.update_visibility',
  'qr.delete',
  'team.invite',
  'team.update_role',
  'team.delete_user',
  'folder.create',
  'folder.update',
  'folder.delete',
  'api_key.create',
  'api_key.delete'
);

CREATE TABLE "audit_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid,
  "action" "audit_action" NOT NULL,
  "entity_type" varchar(64) NOT NULL,
  "entity_id" varchar(64),
  "details" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE set null
);

CREATE INDEX "audit_log_user_id_idx" ON "audit_log" USING btree ("user_id");
CREATE INDEX "audit_log_action_idx" ON "audit_log" USING btree ("action");
CREATE INDEX "audit_log_entity_idx" ON "audit_log" USING btree ("entity_type", "entity_id");
CREATE INDEX "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at");
