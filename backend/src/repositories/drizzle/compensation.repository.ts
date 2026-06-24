import { eq } from "drizzle-orm";

import type { CompensationHistoryRecord } from "../../domain/compensation.types.js";
import { ensureCompensationMonthPartitionExists } from "../../db/ensure-compensation-month-partition.js";
import type { Database } from "../../db/index.js";
import { compensationHistory } from "../../db/schema.js";
import type {
  ICompensationRepository,
  NewCompensationHistoryRecord,
} from "../interfaces/compensation.repository.js";

const COMPENSATION_INSERT_BATCH_SIZE = 500;

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
    await ensureCompensationMonthPartitionExists(this.database, record.effectiveDate);

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

    if (!insertedRecord) {
      throw new Error("Failed to insert compensation history record");
    }

    return insertedRecord;
  }

  async insertManyCompensationHistoryRecords(
    records: NewCompensationHistoryRecord[],
  ) {
    if (records.length === 0) {
      return { inserted: 0, total: 0 };
    }

    const effectiveDates = [
      ...new Set(records.map((record) => record.effectiveDate)),
    ];

    for (const effectiveDate of effectiveDates) {
      await ensureCompensationMonthPartitionExists(this.database, effectiveDate);
    }

    await this.database.transaction(async (transaction) => {
      for (
        let index = 0;
        index < records.length;
        index += COMPENSATION_INSERT_BATCH_SIZE
      ) {
        const batch = records.slice(index, index + COMPENSATION_INSERT_BATCH_SIZE);
        await transaction.insert(compensationHistory).values(batch);
      }
    });

    return {
      inserted: records.length,
      total: records.length,
    };
  }
}
