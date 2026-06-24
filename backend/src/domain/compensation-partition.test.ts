import { describe, expect, it } from "vitest";

import {
  buildCompensationMonthDateRange,
  buildCompensationPartitionTableName,
  deriveCompensationMonthKeyFromEffectiveDate,
  validateCompensationMonthKey,
} from "./compensation-partition.js";

describe("deriveCompensationMonthKeyFromEffectiveDate", () => {
  it("derives a YYYY-MM month key from an effective date", () => {
    expect(deriveCompensationMonthKeyFromEffectiveDate("2026-03-15")).toBe("2026-03");
  });
});

describe("buildCompensationPartitionTableName", () => {
  it("builds a partition table name from a month key", () => {
    expect(buildCompensationPartitionTableName("2026-03")).toBe(
      "compensation_history_2026_03",
    );
  });
});

describe("buildCompensationMonthDateRange", () => {
  it("builds an inclusive start and exclusive end date range", () => {
    expect(buildCompensationMonthDateRange("2026-03")).toEqual({
      rangeStart: "2026-03-01",
      rangeEnd: "2026-04-01",
    });
  });

  it("rolls over to the next year for December partitions", () => {
    expect(buildCompensationMonthDateRange("2026-12")).toEqual({
      rangeStart: "2026-12-01",
      rangeEnd: "2027-01-01",
    });
  });
});

describe("validateCompensationMonthKey", () => {
  it("rejects invalid month keys", () => {
    expect(() => validateCompensationMonthKey("2026-3")).toThrow(
      "Invalid compensation month key: 2026-3",
    );
  });
});
