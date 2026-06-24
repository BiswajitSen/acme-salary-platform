import { COMPENSATION_REASONS } from "@acme/shared";
import { relations, sql } from "drizzle-orm";
import {
  date,
  doublePrecision,
  index,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const employees = pgTable(
  "employees",
  {
    id: text("id").primaryKey(),
    fullName: text("full_name").notNull(),
    department: text("department").notNull(),
    jobTitle: text("job_title").notNull(),
    country: text("country").notNull(),
  },
  (table) => [
    index("idx_employees_department").on(table.department),
    index("idx_employees_country").on(table.country),
    index("idx_employees_full_name").on(table.fullName),
  ],
);

export const compensationHistory = pgTable(
  "compensation_history",
  {
    id: serial("id").notNull(),
    employeeId: text("employee_id")
      .notNull()
      .references(() => employees.id),
    baseSalary: doublePrecision("base_salary").notNull(),
    currency: text("currency").notNull(),
    effectiveDate: date("effective_date", { mode: "string" }).notNull(),
    reason: text("reason", { enum: COMPENSATION_REASONS }).notNull(),
    changedBy: text("changed_by").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    primaryKey({ columns: [table.id, table.effectiveDate] }),
    index("idx_compensation_history_employee_id").on(table.employeeId),
    index("idx_compensation_history_effective_date").on(table.effectiveDate),
  ],
);

export const compensationMonthPartitions = pgTable("compensation_month_partitions", {
  monthKey: text("month_key").primaryKey(),
  partitionTableName: text("partition_table_name").notNull().unique(),
  rangeStart: date("range_start", { mode: "string" }).notNull(),
  rangeEnd: date("range_end", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .default(sql`now()`),
});

export const employeesRelations = relations(employees, ({ many }) => ({
  compensationHistory: many(compensationHistory),
}));

export const compensationHistoryRelations = relations(
  compensationHistory,
  ({ one }) => ({
    employee: one(employees, {
      fields: [compensationHistory.employeeId],
      references: [employees.id],
    }),
  }),
);

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;
export type CompensationRecord = typeof compensationHistory.$inferSelect;
export type NewCompensationRecord = typeof compensationHistory.$inferInsert;
