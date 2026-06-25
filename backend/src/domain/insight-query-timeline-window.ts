import { sql, type SQL } from "drizzle-orm";

import { DEFAULT_INSIGHT_TIMELINE_MONTHS } from "@acme/shared";

const MONTH_NAME_TO_NUMBER: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

export type InsightTimelineWindow = {
  months: number | null;
  sinceDate: string | null;
};

function padMonth(month: number): string {
  return String(month).padStart(2, "0");
}

function parseMonthYear(match: RegExpMatchArray): string | null {
  const monthName = match[1]?.toLowerCase();
  const year = match[2];

  if (!monthName || !year) {
    return null;
  }

  const month = MONTH_NAME_TO_NUMBER[monthName];
  if (month === undefined) {
    return null;
  }

  return `${year}-${padMonth(month)}-01`;
}

export function extractInsightTimelineWindow(normalizedQuery: string): InsightTimelineWindow {
  const isoDateMatch = normalizedQuery.match(
    /\b(?:since|after|from)\s+(\d{4}-\d{2}-\d{2})\b/,
  );
  if (isoDateMatch?.[1]) {
    return { months: null, sinceDate: isoDateMatch[1] };
  }

  const monthYearMatch = normalizedQuery.match(
    /\b(?:since|after|from)\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})\b/i,
  );
  if (monthYearMatch) {
    const sinceDate = parseMonthYear(monthYearMatch);
    if (sinceDate) {
      return { months: null, sinceDate };
    }
  }

  const yearsMatch = normalizedQuery.match(
    /\b(?:last|past|in the last|within the last|after)\s+(\d+)\s*years?\b/,
  );
  if (yearsMatch?.[1]) {
    return { months: Number.parseInt(yearsMatch[1]!, 10) * 12, sinceDate: null };
  }

  const weeksMatch = normalizedQuery.match(
    /\b(?:last|past|in the last|within the last|after)\s+(\d+)\s*weeks?\b/,
  );
  if (weeksMatch?.[1]) {
    const weeks = Number.parseInt(weeksMatch[1]!, 10);
    return { months: Math.max(1, Math.ceil(weeks / 4)), sinceDate: null };
  }

  const monthsMatch = normalizedQuery.match(
    /\b(?:last|past|in the last|within the last|after)\s+(\d+)\s*months?\b/,
  );
  if (monthsMatch?.[1]) {
    return { months: Number.parseInt(monthsMatch[1]!, 10), sinceDate: null };
  }

  return { months: null, sinceDate: null };
}

export function resolveInsightTimelineWindow(
  normalizedQuery: string,
  isTimelineIntent: boolean,
): InsightTimelineWindow {
  if (!isTimelineIntent) {
    return { months: null, sinceDate: null };
  }

  const window = extractInsightTimelineWindow(normalizedQuery);
  if (window.sinceDate !== null) {
    return window;
  }

  return {
    months: window.months ?? DEFAULT_INSIGHT_TIMELINE_MONTHS,
    sinceDate: null,
  };
}

export function buildTimelineStartExpression(
  asOfDate: string,
  window: InsightTimelineWindow,
): SQL {
  if (window.sinceDate !== null) {
    return sql`CAST(${window.sinceDate} AS date)`;
  }

  const months = window.months ?? DEFAULT_INSIGHT_TIMELINE_MONTHS;
  return sql`CAST(${asOfDate} AS date) - (${months} * INTERVAL '1 month')`;
}
