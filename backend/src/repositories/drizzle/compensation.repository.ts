import { eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

import type * as schema from "../../db/schema.js";
import { compensationHistory } from "../../db/schema.js";
import type { CompensationHistoryRecord } from "../../domain/compensation.types.js";
import type { ICompensationRepository, NewCompensationHistoryRecord } from "../interfaces/compensation.repository.js";

type Database = BetterSQLite3Database<typeof schema>;

export class DrizzleCompensationRepository implements ICompensationRepository {
  constructor(private readonly database: Database) {}

  async findCompensationHistoryByEmployeeId(
    employeeId: string,
  ): Promise<CompensationHistoryRecord[]> {
    const rows = await this.database
      .select({
        id: compensationHistory.id,
        employeeId: compensationHistory.employeeId,
        baseSalary: compensationHistory.baseSalary,
        currency: compensationHistory.currency,
        effectiveDate: compensationHistory.effectiveDate,
        reason: compensationHistory.reason,
        changedBy: compensationHistory.changedBy,
        notes: compensationHistory.notes,
        createdAt: compensationHistory.createdAt,
      })
      .from(compensationHistory)
      .where(eq(compensationHistory.employeeId, employeeId));

    return rows;
  }

  async insertCompensationHistoryRecord(
    record: NewCompensationHistoryRecord,
  ): Promise<CompensationHistoryRecord> {
    const [insertedRecord] = await this.database
      .insert(compensationHistory)
      .values({
        employeeId: record.employeeId,
        baseSalary: record.baseSalary,
        currency: record.currency,
        effectiveDate: record.effectiveDate,
        reason: record.reason,
        changedBy: record.changedBy,
        notes: record.notes,
      })
      .returning({
        id: compensationHistory.id,
        employeeId: compensationHistory.employeeId,
        baseSalary: compensationHistory.baseSalary,
        currency: compensationHistory.currency,
        effectiveDate: compensationHistory.effectiveDate,
        reason: compensationHistory.reason,
        changedBy: compensationHistory.changedBy,
        notes: compensationHistory.notes,
        createdAt: compensationHistory.createdAt,
      });

    return insertedRecord;
  }
}
