import { COMPENSATION_REASONS, type CompensationReason } from "@acme/shared";

const REASON_PATTERNS: ReadonlyArray<{
  pattern: RegExp;
  reason: CompensationReason;
}> = [
  { pattern: /\b(?:corrections?|corrected)\b/i, reason: "Correction" },
  { pattern: /\bmarket\s+adjustments?\b/i, reason: "Market Adjustment" },
  { pattern: /\b(?:new\s+hires?|new\s+joiners?|joined)\b/i, reason: "New Hire" },
  { pattern: /\b(?:promotion|promoted|promotions)\b/i, reason: "Promotion" },
  { pattern: /\b(?:annual\s+increments?|salary\s+(?:hike|hikes|increase|increases|raise|raises))\b/i, reason: "Annual Increment" },
];

export function extractExplicitCompensationReason(
  normalizedQuery: string,
): CompensationReason | null {
  for (const { pattern, reason } of REASON_PATTERNS) {
    if (pattern.test(normalizedQuery)) {
      return reason;
    }
  }

  return null;
}

export function isKnownCompensationReason(value: string): value is CompensationReason {
  return (COMPENSATION_REASONS as readonly string[]).includes(value);
}
