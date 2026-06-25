import type { CompensationReason } from "@acme/shared";

import type { CompensationHistoryRecord } from "./compensation.types.js";
import { sortCompensationHistoryOldestFirst } from "./compensation-timeline.js";

export const SALARY_INCREASE_REASONS = ["Annual Increment", "Promotion"] as const;

export type SalaryIncreaseReason = (typeof SALARY_INCREASE_REASONS)[number];

export type ProposedCompensationChange = {
  baseSalary: number;
  currency: string;
  effectiveDate: string;
  reason: CompensationReason;
};

function isSalaryIncreaseReason(reason: CompensationReason): reason is SalaryIncreaseReason {
  return (SALARY_INCREASE_REASONS as readonly CompensationReason[]).includes(reason);
}

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
