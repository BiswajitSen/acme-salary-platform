CREATE TABLE IF NOT EXISTS "compensation_history" (
  "id" serial NOT NULL,
  "employee_id" text NOT NULL,
  "base_salary" double precision NOT NULL,
  "currency" text NOT NULL,
  "effective_date" date NOT NULL,
  "reason" text NOT NULL,
  "changed_by" text NOT NULL,
  "notes" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "compensation_history_employee_id_employees_id_fk"
    FOREIGN KEY ("employee_id") REFERENCES "employees"("id"),
  CONSTRAINT "compensation_history_id_effective_date_pk"
    PRIMARY KEY ("id", "effective_date")
) PARTITION BY RANGE ("effective_date");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "compensation_month_partitions" (
  "month_key" text PRIMARY KEY NOT NULL,
  "partition_table_name" text NOT NULL UNIQUE,
  "range_start" date NOT NULL,
  "range_end" date NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_compensation_history_employee_id"
  ON "compensation_history" ("employee_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_compensation_history_effective_date"
  ON "compensation_history" ("effective_date");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "compensation_history_2024_01"
  PARTITION OF "compensation_history"
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "compensation_history_2024_06"
  PARTITION OF "compensation_history"
  FOR VALUES FROM ('2024-06-01') TO ('2024-07-01');
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "compensation_history_2025_01"
  PARTITION OF "compensation_history"
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
--> statement-breakpoint
INSERT INTO "compensation_month_partitions" ("month_key", "partition_table_name", "range_start", "range_end")
VALUES
  ('2024-01', 'compensation_history_2024_01', '2024-01-01', '2024-02-01'),
  ('2024-06', 'compensation_history_2024_06', '2024-06-01', '2024-07-01'),
  ('2025-01', 'compensation_history_2025_01', '2025-01-01', '2025-02-01')
ON CONFLICT ("month_key") DO NOTHING;
