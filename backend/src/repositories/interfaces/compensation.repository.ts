import type { CompensationHistoryRecord } from "../../domain/compensation.types.js";

export interface ICompensationRepository {
  findCompensationHistoryByEmployeeId(
    employeeId: string,
  ): Promise<CompensationHistoryRecord[]>;
}
