import {
  extractInsightDepartment,
  resolveDepartmentFromAlias,
} from "./insight-query-department-aliases.js";

export const JOINED_AS_PATTERN =
  /\bjoined\s+as\s+(.+?)(?:\s+(?:in|within|during)\s+(?:the\s+)?(?:last|past|after|since)\b|$)/i;

const TIMELINE_TAIL_PATTERN =
  /\s+(?:in|within|during)\s+(?:the\s+)?(?:last|past|after|since)\b.*$/i;

function normalizeJobTitle(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function trimTimelineTail(value: string): string {
  return normalizeJobTitle(value.replace(TIMELINE_TAIL_PATTERN, ""));
}

function extractJoinedAsPhrase(originalQuery: string, normalizedQuery: string): string | null {
  const match = normalizedQuery.match(JOINED_AS_PATTERN);
  if (!match?.[1]) {
    return null;
  }

  const trimmedNormalized = trimTimelineTail(match[1]);
  if (trimmedNormalized.length === 0) {
    return null;
  }

  const startIndex = normalizedQuery.indexOf(match[0]);
  const joinedAsOffset = match[0].toLowerCase().indexOf("joined as");
  const phraseStart = startIndex + joinedAsOffset + "joined as".length;
  const trailing = originalQuery.slice(phraseStart);
  const localStart = trailing.toLowerCase().indexOf(trimmedNormalized.toLowerCase());
  if (localStart === -1) {
    return trimmedNormalized;
  }

  return trimTimelineTail(
    trailing.slice(localStart, localStart + trimmedNormalized.length),
  );
}

export function extractJoinedAsScope(
  originalQuery: string,
  normalizedQuery: string,
): {
  department: string | null;
  jobTitle: string | null;
} {
  const phrase = extractJoinedAsPhrase(originalQuery, normalizedQuery);
  if (phrase === null) {
    return { department: null, jobTitle: null };
  }

  const department = resolveDepartmentFromAlias(phrase);
  if (department !== null) {
    return { department, jobTitle: null };
  }

  return { department: null, jobTitle: phrase };
}

export function extractInsightJobTitle(
  originalQuery: string,
  normalizedQuery: string,
): string | null {
  const joinedAsScope = extractJoinedAsScope(originalQuery, normalizedQuery);
  if (joinedAsScope.jobTitle !== null) {
    return joinedAsScope.jobTitle;
  }

  const titlePatterns = [
    /\b(?:with\s+title|job\s+title|title)\s+([a-z][a-z\s/-]{1,60})\b/i,
    /\bas\s+(?:a\s+)?([a-z][a-z\s/-]{1,60})\b/i,
  ] as const;

  for (const pattern of titlePatterns) {
    const match = normalizedQuery.match(pattern);
    if (!match?.[1]) {
      continue;
    }

    const candidate = trimTimelineTail(match[1]);
    if (candidate.length === 0 || resolveDepartmentFromAlias(candidate) !== null) {
      continue;
    }

    if (extractInsightDepartment(candidate) !== null && candidate.split(/\s+/).length <= 2) {
      continue;
    }

    return candidate;
  }

  return null;
}
