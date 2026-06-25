import type { InsightMedianSplitFocus } from "@acme/shared";

export function extractMedianSplitFocus(
  normalizedQuery: string,
): InsightMedianSplitFocus | null {
  if (
    /\b(?:below\s+and\s+above|above\s+and\s+below)\s+(?:the\s+)?median(?:\s+(?:salary|pay|compensation))?\b/.test(
      normalizedQuery,
    )
  ) {
    return "both";
  }

  if (/\bbelow\s+(?:the\s+)?median(?:\s+(?:salary|pay|compensation))?\b/.test(normalizedQuery)) {
    return "below";
  }

  if (/\babove\s+(?:the\s+)?median(?:\s+(?:salary|pay|compensation))?\b/.test(normalizedQuery)) {
    return "above";
  }

  return null;
}
