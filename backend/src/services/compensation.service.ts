import {
  recordCompensationChangeSchema,
  type RecordCompensationChangeResponse,
} from "@acme/shared";

import { buildCompensationTimeline } from "../domain/compensation-timeline.js";
import { toNewCompensationHistoryRecord } from "../domain/compensation-record.js";
import {
  validateNewHireReason,
  validateSalaryIncreaseReason,
} from "../domain/validate-compensation-change.js";
import { AppError } from "../lib/errors.js";
import type { ICompensationRepository } from "../repositories/interfaces/compensation.repository.js";
import type { IEmployeeRepository } from "../repositories/interfaces/employee.repository.js";

export class CompensationService {
  constructor(
    private readonly employees: IEmployeeRepository,
    private readonly compensation: ICompensationRepository,
  ) {}

  async recordCompensationChange(
    employeeId: string,
    input: unknown,
  ): Promise<RecordCompensationChangeResponse> {
    const parsedChange = recordCompensationChangeSchema.parse(input);
    const employee = await this.employees.findEmployeeById(employeeId);

    if (!employee) {
      throw new AppError(404, `Employee ${employeeId} not found`);
    }

    const existingHistory =
      await this.compensation.findCompensationHistoryByEmployeeId(employeeId);

    const newHireError = validateNewHireReason(existingHistory, parsedChange.reason);

    if (newHireError) {
      throw new AppError(400, newHireError);
    }

    const salaryIncreaseError = validateSalaryIncreaseReason(existingHistory, parsedChange);

    if (salaryIncreaseError) {
      throw new AppError(400, salaryIncreaseError);
    }

    await this.compensation.insertCompensationHistoryRecord(
      toNewCompensationHistoryRecord(employeeId, parsedChange),
    );

    const updatedHistory =
      await this.compensation.findCompensationHistoryByEmployeeId(employeeId);
    const timelineEntries = buildCompensationTimeline(updatedHistory);
    const newestEntry = timelineEntries[0];

    if (!newestEntry) {
      throw new AppError(500, "Failed to load recorded compensation change");
    }

    return { entry: newestEntry };
  }
}
