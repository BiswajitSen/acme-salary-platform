import type { CompensationImportValidationIssue } from "@acme/shared";

import styles from "./compensation-import-preview.module.css";

type CompensationImportPreviewPanelProps = {
  recordCount: number;
  validationIssues: CompensationImportValidationIssue[];
  hiddenIssueCount: number;
};

export function CompensationImportPreviewPanel({
  recordCount,
  validationIssues,
  hiddenIssueCount,
}: CompensationImportPreviewPanelProps) {
  const isValid = validationIssues.length === 0;

  return (
    <section className={styles.panel} aria-live="polite">
      {isValid ? (
        <p className={styles.successMessage}>
          All clear. {recordCount.toLocaleString()} compensation records are ready to
          import.
        </p>
      ) : (
        <>
          <p className={styles.errorSummary}>
            Fix the issues below before importing. No compensation records will be
            written until the spreadsheet is fully valid.
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
