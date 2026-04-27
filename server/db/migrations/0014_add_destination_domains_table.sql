CREATE TABLE IF NOT EXISTS "destination_domains" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "domain" varchar(255) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "destination_domains_domain_unique" UNIQUE("domain")
);
