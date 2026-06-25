type ZodValidationIssue = {
  path: (string | number)[];
  message: string;
};

export function collectFieldErrorsFromValidationIssues(
  issues: ZodValidationIssue[],
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  for (const issue of issues) {
    const fieldName = issue.path[0];

    if (typeof fieldName === "string" && !fieldErrors[fieldName]) {
      fieldErrors[fieldName] = issue.message;
    }
  }

  return fieldErrors;
}
