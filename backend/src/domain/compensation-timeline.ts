import type {
  CompensationTimelineEntry,
  CurrentCompensation,
} from "@acme/shared";

import type { CompensationHistoryRecord } from "./compensation.types.js";

function compareCompensationHistoryRecords(
  left: CompensationHistoryRecord,
  right: CompensationHistoryRecord,
): number {
  const effectiveDateCompare = left.effectiveDate.localeCompare(right.effectiveDate);

  if (effectiveDateCompare !== 0) {
    return effectiveDateCompare;
  }

  const createdAtCompare = left.createdAt.localeCompare(right.createdAt);

  if (createdAtCompare !== 0) {
    return createdAtCompare;
  }

  return left.id - right.id;
}

export function sortCompensationHistoryOldestFirst(
  records: CompensationHistoryRecord[],
): CompensationHistoryRecord[] {
  return [...records].sort(compareCompensationHistoryRecords);
}

export function sortCompensationHistoryNewestFirst(
  records: CompensationHistoryRecord[],
): CompensationHistoryRecord[] {
  return [...records].sort((left, right) => compareCompensationHistoryRecords(right, left));
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
  const chronologicalRecords = sortCompensationHistoryOldestFirst(records);
  const previousById = new Map<
    number,
    { previousSalary: number; previousCurrency: string } | null
  >();

  chronologicalRecords.forEach((record, index) => {
    const previousRecord = chronologicalRecords[index - 1];

    previousById.set(
      record.id,
      previousRecord
        ? {
            previousSalary: previousRecord.baseSalary,
            previousCurrency: previousRecord.currency,
          }
        : null,
    );
  });

  return sortCompensationHistoryNewestFirst(records).map((record) => {
    const previous = previousById.get(record.id) ?? null;

    return {
      id: record.id,
      previousSalary: previous?.previousSalary ?? null,
      previousCurrency: previous?.previousCurrency ?? null,
      baseSalary: record.baseSalary,
      currency: record.currency,
      effectiveDate: record.effectiveDate,
      reason: record.reason as CompensationTimelineEntry["reason"],
      changedBy: record.changedBy,
      notes: record.notes,
      createdAt: record.createdAt,
    };
  });
}
