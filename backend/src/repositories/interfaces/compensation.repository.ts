import type { CompensationHistoryRecord } from "../../domain/compensation.types.js";

export type NewCompensationHistoryRecord = Omit<
  CompensationHistoryRecord,
  "id" | "createdAt"
>;

export interface ICompensationRepository {
  findCompensationHistoryByEmployeeId(
    employeeId: string,
  ): Promise<CompensationHistoryRecord[]>;
  insertCompensationHistoryRecord(
    record: NewCompensationHistoryRecord,
  ): Promise<CompensationHistoryRecord>;
}
