CREATE TABLE "scan_daily_stats" (
	"date" date NOT NULL,
	"qr_code_id" uuid NOT NULL,
	"total_scans" integer DEFAULT 0 NOT NULL,
	"unique_scans" integer DEFAULT 0 NOT NULL,
	"country_breakdown" jsonb DEFAULT '{}',
	"device_breakdown" jsonb DEFAULT '{}',
	CONSTRAINT "scan_daily_stats_pkey" PRIMARY KEY("date","qr_code_id")
);
--> statement-breakpoint
ALTER TABLE "scan_daily_stats" ADD CONSTRAINT "scan_daily_stats_qr_code_id_qr_codes_id_fk" FOREIGN KEY ("qr_code_id") REFERENCES "public"."qr_codes"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "sds_qr_code_idx" ON "scan_daily_stats" USING btree ("qr_code_id");
--> statement-breakpoint
CREATE INDEX "sds_date_idx" ON "scan_daily_stats" USING btree ("date");