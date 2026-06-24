"use client";

import Link from "next/link";

import { CompensationImportPreviewPanel } from "@/components/compensation-import/compensation-import-preview";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusMessage } from "@/components/ui/status-message";
import { useCompensationImport } from "@/lib/hooks/use-compensation-import";

import styles from "./compensation-import.module.css";

const MAX_VISIBLE_VALIDATION_ISSUES = 50;

export function CompensationImport() {
  const {
    selectedFile,
    preview,
    result,
    validationIssues,
    isPreviewing,
    isImporting,
    errorMessage,
    selectFile,
    previewImport,
    confirmImport,
    resetImport,
  } = useCompensationImport();

  const canPreview = Boolean(selectedFile) && !isPreviewing && !isImporting;
  const canConfirm =
    Boolean(selectedFile) &&
    preview?.isValid === true &&
    !isPreviewing &&
    !isImporting;
  const hiddenIssueCount = preview
    ? Math.max(preview.errors.length - MAX_VISIBLE_VALIDATION_ISSUES, 0)
    : 0;

  return (
    <section className={styles.page}>
      <PageHeader
        title="Import Compensation History"
        subtitle="Upload an Excel spreadsheet to append compensation history records."
      />

      <Card title="Spreadsheet upload">
        <div className={styles.uploadSection}>
          <label className={styles.fileLabel} htmlFor="compensation-import-file">
            Excel file (.xlsx)
          </label>
          <input
            id="compensation-import-file"
            className={styles.fileInput}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(event) => {
              selectFile(event.target.files?.[0] ?? null);
            }}
          />
          {selectedFile && (
            <p className={styles.fileName}>
              Selected file: <strong>{selectedFile.name}</strong>
            </p>
          )}
          <p className={styles.helpText}>
            Required columns: employee id, base salary, currency, effective date, reason,
            changed by, notes.
          </p>
        </div>

        <div className={styles.actions}>
          <Button
            variant="secondary"
            disabled={!canPreview}
            onClick={() => {
              void previewImport();
            }}
          >
            {isPreviewing ? "Previewing…" : "Preview import"}
          </Button>
          <Button
            variant="primary"
            disabled={!canConfirm}
            onClick={() => {
              void confirmImport();
            }}
          >
            {isImporting ? "Importing…" : "Confirm import"}
          </Button>
        </div>
      </Card>

      {errorMessage && <Alert variant="error">{errorMessage}</Alert>}

      {isPreviewing && <StatusMessage isLoading message="Validating spreadsheet…" />}

      {preview && !isPreviewing && (
        <Card title="Import preview">
          <CompensationImportPreviewPanel
            recordCount={preview.records.length}
            validationIssues={validationIssues}
            hiddenIssueCount={hiddenIssueCount}
          />
        </Card>
      )}

      {result && (
        <Card title="Import complete">
          <p className={styles.resultMessage}>
            Imported {result.total.toLocaleString()} compensation records.
          </p>
          <div className={styles.actions}>
            <Button variant="secondary" onClick={resetImport}>
              Import another file
            </Button>
            <Link href="/" className={styles.profileLink}>
              View employee directory
            </Link>
          </div>
        </Card>
      )}
    </section>
  );
}
