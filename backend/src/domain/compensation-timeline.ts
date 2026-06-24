import type {
  CompensationTimelineEntry,
  CurrentCompensation,
} from "@acme/shared";

import type { CompensationHistoryRecord } from "./compensation.types.js";

export function sortCompensationHistoryNewestFirst(
  records: CompensationHistoryRecord[],
): CompensationHistoryRecord[] {
  return [...records].sort((left, right) => {
    const effectiveDateCompare = right.effectiveDate.localeCompare(left.effectiveDate);

    if (effectiveDateCompare !== 0) {
      return effectiveDateCompare;
    }

    return right.id - left.id;
  });
}

export function selectCurrentCompensation(
  records: CompensationHistoryRecord[],
): CurrentCompensation | null {
  const [latestRecord] = sortCompensationHistoryNewestFirst(records);

  if (!latestRecord) {
    return null;
  }

  return {
    baseSalary: latestRecord.baseSalary,
    currency: latestRecord.currency,
    effectiveDate: latestRecord.effectiveDate,
    reason: latestRecord.reason as CurrentCompensation["reason"],
    changedBy: latestRecord.changedBy,
    lastUpdated: latestRecord.createdAt,
  };
}

export function buildCompensationTimeline(
  records: CompensationHistoryRecord[],
): CompensationTimelineEntry[] {
  const sortedRecords = sortCompensationHistoryNewestFirst(records);

  return sortedRecords.map((record, index) => ({
    id: record.id,
    previousSalary: sortedRecords[index + 1]?.baseSalary ?? null,
    baseSalary: record.baseSalary,
    currency: record.currency,
    effectiveDate: record.effectiveDate,
    reason: record.reason as CompensationTimelineEntry["reason"],
    changedBy: record.changedBy,
    notes: record.notes,
    createdAt: record.createdAt,
  }));
}
