import type { CompensationReason } from "@acme/shared";
import {
  isSalaryIncreaseReason,
  NEW_HIRE_REQUIRES_EMPTY_HISTORY_MESSAGE,
} from "@acme/shared";

import type { CompensationHistoryRecord } from "./compensation.types.js";
import { sortCompensationHistoryOldestFirst } from "./compensation-timeline.js";

export type ProposedCompensationChange = {
  baseSalary: number;
  currency: string;
  effectiveDate: string;
  reason: CompensationReason;
};

export function findPredecessorForNewRecord(
  records: CompensationHistoryRecord[],
  effectiveDate: string,
): CompensationHistoryRecord | null {
  const chronologicalRecords = sortCompensationHistoryOldestFirst(records);
  let predecessor: CompensationHistoryRecord | null = null;

  for (const record of chronologicalRecords) {
    if (record.effectiveDate > effectiveDate) {
      break;
    }

    predecessor = record;
  }

  return predecessor;
}

export function validateNewHireReason(
  existingHistory: CompensationHistoryRecord[],
  reason: CompensationReason,
): string | null {
  if (reason === "New Hire" && existingHistory.length > 0) {
    return NEW_HIRE_REQUIRES_EMPTY_HISTORY_MESSAGE;
  }

  return null;
}

export function validateSalaryIncreaseReason(
  existingHistory: CompensationHistoryRecord[],
  proposed: ProposedCompensationChange,
): string | null {
  if (!isSalaryIncreaseReason(proposed.reason)) {
    return null;
  }

  const predecessor = findPredecessorForNewRecord(existingHistory, proposed.effectiveDate);

  if (!predecessor) {
    return `${proposed.reason} requires an existing compensation record`;
  }

  if (proposed.currency !== predecessor.currency) {
    return `${proposed.reason} must use ${predecessor.currency} to match the previous salary`;
  }

  if (proposed.baseSalary < predecessor.baseSalary) {
    return `${proposed.reason} salary cannot be less than the previous salary of ${predecessor.baseSalary} ${predecessor.currency}`;
  }

  return null;
}

export { isSalaryIncreaseReason, SALARY_INCREASE_REASONS } from "@acme/shared";
