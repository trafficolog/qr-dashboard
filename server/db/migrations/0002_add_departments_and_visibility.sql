CREATE TYPE "public"."qr_visibility" AS ENUM('private', 'department', 'public');--> statement-breakpoint

CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

ALTER TABLE "qr_codes"
	ADD COLUMN "visibility" "qr_visibility" DEFAULT 'private' NOT NULL,
	ADD COLUMN "department_id" uuid;--> statement-breakpoint

ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

CREATE INDEX "qr_visibility_idx" ON "qr_codes" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "qr_department_idx" ON "qr_codes" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "qr_visibility_department_idx" ON "qr_codes" USING btree ("visibility","department_id");
