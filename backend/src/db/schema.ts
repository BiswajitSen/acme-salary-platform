import { COMPENSATION_REASONS } from "@acme/shared";
import { relations, sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const employees = sqliteTable(
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

export const compensationHistory = sqliteTable("compensation_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeId: text("employee_id")
    .notNull()
    .references(() => employees.id),
  baseSalary: real("base_salary").notNull(),
  currency: text("currency", { length: 3 }).notNull(),
  effectiveDate: text("effective_date").notNull(),
  reason: text("reason", { enum: COMPENSATION_REASONS }).notNull(),
  changedBy: text("changed_by").notNull(),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
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
