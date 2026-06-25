"use client";

import Link from "next/link";

import { CompensationImportPreviewPanel } from "@/components/compensation-import/compensation-import-preview";
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
import { useCompensationImport } from "@/lib/hooks/use-compensation-import";

const MAX_VISIBLE_VALIDATION_ISSUES = 50;

const REQUIRED_COLUMNS = [
  "employee id",
  "base salary",
  "currency",
  "effective date",
  "reason",
  "changed by",
  "notes",
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
  const currentStep = resolveCurrentStep(result, preview, isPreviewing);

  return (
    <section className={sharedStyles.page}>
      <PageHeader
        title="Import Compensation History"
        subtitle="Upload an Excel spreadsheet to append compensation history records."
      />

      <ImportSteps currentStep={currentStep} />

      <div className={sharedStyles.layout}>
        <div className={sharedStyles.mainColumn}>
          <Card title="Spreadsheet upload">
            <ImportUploadZone
              inputId="compensation-import-file"
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

          {validationIssues.length > 0 && !preview && !isPreviewing && (
            <Card title="Import preview">
              <CompensationImportPreviewPanel
                recordCount={0}
                validationIssues={validationIssues}
                hiddenIssueCount={0}
              />
            </Card>
          )}

          {preview && !isPreviewing && !errorMessage && (
            <Card title="Import preview">
              <CompensationImportPreviewPanel
                recordCount={preview.recordCount}
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
                    Imported {result.total.toLocaleString()} compensation records.
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
            "Each row appends a compensation history record for an existing employee.",
            "Employee IDs must already exist in the directory.",
            "Preview checks formatting, dates, and salary values before import.",
          ]}
          requiredColumns={REQUIRED_COLUMNS}
        />
      </div>
    </section>
  );
}
