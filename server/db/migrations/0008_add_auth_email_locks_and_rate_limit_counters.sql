CREATE TABLE "auth_email_locks" (
  "email" varchar(255) PRIMARY KEY NOT NULL,
  "locked_until" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "rate_limit_counters" (
  "id" varchar(160) PRIMARY KEY NOT NULL,
  "scope" varchar(32) NOT NULL,
  "key" varchar(128) NOT NULL,
  "window_start" timestamp with time zone NOT NULL,
  "reset_at" timestamp with time zone NOT NULL,
  "count" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "rate_limit_scope_key_window_uidx"
  ON "rate_limit_counters" USING btree ("scope", "key", "window_start");
