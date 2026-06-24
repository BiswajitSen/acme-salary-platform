import type { EmployeeImportValidationIssue } from "@acme/shared";

import styles from "./employee-import-preview.module.css";

type EmployeeImportPreviewPanelProps = {
  employeeCount: number;
  validationIssues: EmployeeImportValidationIssue[];
  hiddenIssueCount: number;
};

export function EmployeeImportPreviewPanel({
  employeeCount,
  validationIssues,
  hiddenIssueCount,
}: EmployeeImportPreviewPanelProps) {
  const isValid = validationIssues.length === 0;

  return (
    <section className={styles.panel} aria-live="polite">
      {isValid ? (
        <p className={styles.successMessage}>
          All clear. {employeeCount.toLocaleString()} employees are ready to import.
        </p>
      ) : (
        <>
          <p className={styles.errorSummary}>
            Fix the issues below before importing. No employees will be written until
            the spreadsheet is fully valid.
          </p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Row</th>
                  <th scope="col">Field</th>
                  <th scope="col">Issue</th>
                </tr>
              </thead>
              <tbody>
                {validationIssues.map((issue) => (
                  <tr key={`${issue.rowNumber}-${issue.field}-${issue.message}`}>
                    <td>{issue.rowNumber}</td>
                    <td>{issue.field}</td>
                    <td>{issue.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hiddenIssueCount > 0 && (
            <p className={styles.moreIssues}>
              And {hiddenIssueCount.toLocaleString()} more issues not shown.
            </p>
          )}
        </>
      )}
    </section>
  );
}
