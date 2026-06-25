"use client";

import type {
  EmployeeImportPreviewResponse,
  EmployeeImportResultResponse,
  EmployeeImportValidationIssue,
} from "@acme/shared";
import { useState } from "react";

import {
  confirmEmployeeImport,
  previewEmployeeImport,
  readEmployeeImportValidationIssues,
} from "@/lib/api/employee-import";
import { getRequestErrorMessage } from "@/lib/errors";

const MAX_VISIBLE_VALIDATION_ISSUES = 50;

type EmployeeImportState = {
  selectedFile: File | null;
  preview: EmployeeImportPreviewResponse | null;
  result: EmployeeImportResultResponse | null;
  validationIssues: EmployeeImportValidationIssue[];
  isPreviewing: boolean;
  isImporting: boolean;
  errorMessage: string | null;
  selectFile: (file: File | null) => void;
  previewImport: () => Promise<void>;
  confirmImport: () => Promise<void>;
  resetImport: () => void;
};

export function useEmployeeImport(): EmployeeImportState {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<EmployeeImportPreviewResponse | null>(null);
  const [result, setResult] = useState<EmployeeImportResultResponse | null>(null);
  const [validationIssues, setValidationIssues] = useState<
    EmployeeImportValidationIssue[]
  >([]);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function selectFile(file: File | null) {
    setSelectedFile(file);
    setPreview(null);
    setResult(null);
    setValidationIssues([]);
    setErrorMessage(null);
  }

  function resetImport() {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setValidationIssues([]);
    setErrorMessage(null);
  }

  async function previewImport() {
    if (!selectedFile) {
      setErrorMessage("Choose an Excel file before previewing the import.");
      return;
    }

    setIsPreviewing(true);
    setErrorMessage(null);
    setResult(null);
    setValidationIssues([]);

    try {
      const nextPreview = await previewEmployeeImport(selectedFile);
      setPreview(nextPreview);

      if (!nextPreview.isValid) {
        setValidationIssues(nextPreview.errors.slice(0, MAX_VISIBLE_VALIDATION_ISSUES));
      }
    } catch (error) {
      setPreview(null);
      setValidationIssues(readEmployeeImportValidationIssues(error));
      setErrorMessage("Unable to preview the spreadsheet. Check the file and try again.");
    } finally {
      setIsPreviewing(false);
    }
  }

  async function confirmImport() {
    if (!selectedFile) {
      setErrorMessage("Choose an Excel file before confirming the import.");
      return;
    }

    setIsImporting(true);
    setErrorMessage(null);

    try {
      const nextResult = await confirmEmployeeImport(selectedFile);
      setResult(nextResult);
      setPreview(null);
      setValidationIssues([]);
    } catch (error) {
      setResult(null);
      setValidationIssues(readEmployeeImportValidationIssues(error));
      setErrorMessage(
        getRequestErrorMessage(error, "Import failed. Fix the spreadsheet issues and try again."),
      );
    } finally {
      setIsImporting(false);
    }
  }

  return {
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
  };
}
