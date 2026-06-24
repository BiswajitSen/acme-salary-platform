"use client";

import Link from "next/link";

import { EmployeeImportPreviewPanel } from "@/components/employee-import/employee-import-preview";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusMessage } from "@/components/ui/status-message";
import { useEmployeeImport } from "@/lib/hooks/use-employee-import";

import styles from "./employee-import.module.css";

const MAX_VISIBLE_VALIDATION_ISSUES = 50;

export function EmployeeImport() {
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
  } = useEmployeeImport();

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
        title="Import Employees"
        subtitle="Upload an Excel spreadsheet to add or update employee records."
      />

      <Card title="Spreadsheet upload">
        <div className={styles.uploadSection}>
          <label className={styles.fileLabel} htmlFor="employee-import-file">
            Excel file (.xlsx)
          </label>
          <input
            id="employee-import-file"
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
            Required columns: employee id, full name, department, job title, country.
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
          <EmployeeImportPreviewPanel
            employeeCount={preview.employees.length}
            validationIssues={validationIssues}
            hiddenIssueCount={hiddenIssueCount}
          />
        </Card>
      )}

      {result && (
        <Card title="Import complete">
          <p className={styles.resultMessage}>
            Imported {result.total.toLocaleString()} employees (
            {result.inserted.toLocaleString()} new, {result.updated.toLocaleString()}{" "}
            updated).
          </p>
          <div className={styles.actions}>
            <Button variant="secondary" onClick={resetImport}>
              Import another file
            </Button>
            <Link href="/" className={styles.directoryLink}>
              View employee directory
            </Link>
          </div>
        </Card>
      )}
    </section>
  );
}
