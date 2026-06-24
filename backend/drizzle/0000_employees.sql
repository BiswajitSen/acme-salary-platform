CREATE TABLE IF NOT EXISTS "employees" (
  "id" text PRIMARY KEY NOT NULL,
  "full_name" text NOT NULL,
  "department" text NOT NULL,
  "job_title" text NOT NULL,
  "country" text NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_employees_department" ON "employees" ("department");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_employees_country" ON "employees" ("country");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_employees_full_name" ON "employees" ("full_name");
