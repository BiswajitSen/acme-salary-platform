import type { CompensationHistoryRecord } from "../../domain/compensation.types.js";

export type NewCompensationHistoryRecord = Omit<
  CompensationHistoryRecord,
  "id" | "createdAt"
>;

export type CompensationImportResult = {
  inserted: number;
  total: number;
};

export interface ICompensationRepository {
  findCompensationHistoryByEmployeeId(
    employeeId: string,
  ): Promise<CompensationHistoryRecord[]>;
  findCompensationHistoryByEmployeeIds(
    employeeIds: string[],
  ): Promise<Map<string, CompensationHistoryRecord[]>>;
  insertCompensationHistoryRecord(
    record: NewCompensationHistoryRecord,
  ): Promise<CompensationHistoryRecord>;
  insertManyCompensationHistoryRecords(
    records: NewCompensationHistoryRecord[],
  ): Promise<CompensationImportResult>;
  findEmployeeIdsWithCompensationHistory(employeeIds: string[]): Promise<Set<string>>;
}
