"use client";

import Link from "next/link";

import { EmployeeImportPreviewPanel } from "@/components/employee-import/employee-import-preview";
import { ImportAside } from "@/components/import/import-aside";
import sharedStyles from "@/components/import/import-shared.module.css";
import { ImportSteps } from "@/components/import/import-steps";
import type { ImportFlowStep } from "@/components/import/import-steps";
import { ImportUploadZone } from "@/components/import/import-upload-zone";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusMessage } from "@/components/ui/status-message";
import { useEmployeeImport } from "@/lib/hooks/use-employee-import";

const MAX_VISIBLE_VALIDATION_ISSUES = 50;

const REQUIRED_COLUMNS = [
  "employee id",
  "full name",
  "department",
  "job title",
  "country",
];

function resolveCurrentStep(
  result: unknown,
  preview: unknown,
  isPreviewing: boolean,
): ImportFlowStep {
  if (result) {
    return "complete";
  }

  if (preview || isPreviewing) {
    return "preview";
  }

  return "upload";
}

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
  const currentStep = resolveCurrentStep(result, preview, isPreviewing);

  return (
    <section className={sharedStyles.page}>
      <PageHeader
        title="Import Employees"
        subtitle="Upload an Excel spreadsheet to add or update employee records."
      />

      <ImportSteps currentStep={currentStep} />

      <div className={sharedStyles.layout}>
        <div className={sharedStyles.mainColumn}>
          <Card title="Spreadsheet upload">
            <ImportUploadZone
              inputId="employee-import-file"
              selectedFile={selectedFile}
              disabled={isPreviewing || isImporting}
              onFileSelect={selectFile}
            />

            <div className={sharedStyles.actions}>
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

          {isPreviewing && (
            <StatusMessage isLoading message="Validating spreadsheet…" />
          )}

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
              <div className={sharedStyles.successBanner}>
                <span className={sharedStyles.successIcon} aria-hidden="true">
                  ✓
                </span>
                <div className={sharedStyles.successContent}>
                  <p className={sharedStyles.successTitle}>Import successful</p>
                  <p className={sharedStyles.successMessage}>
                    Imported {result.total.toLocaleString()} employees (
                    {result.inserted.toLocaleString()} new,{" "}
                    {result.updated.toLocaleString()} updated).
                  </p>
                </div>
              </div>
              <div className={sharedStyles.actions}>
                <Button variant="secondary" onClick={resetImport}>
                  Import another file
                </Button>
                <Link href="/" className={sharedStyles.textLink}>
                  View employee directory
                </Link>
              </div>
            </Card>
          )}
        </div>

        <ImportAside
          title="Before you import"
          guidance={[
            "Preview validates every row before anything is written.",
            "Existing employee IDs are updated; new IDs are inserted.",
            "Fix all validation issues in the spreadsheet, then preview again.",
          ]}
          requiredColumns={REQUIRED_COLUMNS}
        />
      </div>
    </section>
  );
}
