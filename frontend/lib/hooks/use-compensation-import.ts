"use client";

import type {
  CompensationImportPreviewResponse,
  CompensationImportResultResponse,
  CompensationImportValidationIssue,
} from "@acme/shared";
import { useState } from "react";

import {
  confirmCompensationImport,
  previewCompensationImport,
  readCompensationImportValidationIssues,
} from "@/lib/api/compensation-import";
import { isApiRequestError } from "@/lib/api/client";

const MAX_VISIBLE_VALIDATION_ISSUES = 50;

type CompensationImportState = {
  selectedFile: File | null;
  preview: CompensationImportPreviewResponse | null;
  result: CompensationImportResultResponse | null;
  validationIssues: CompensationImportValidationIssue[];
  isPreviewing: boolean;
  isImporting: boolean;
  errorMessage: string | null;
  selectFile: (file: File | null) => void;
  previewImport: () => Promise<void>;
  confirmImport: () => Promise<void>;
  resetImport: () => void;
};

export function useCompensationImport(): CompensationImportState {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CompensationImportPreviewResponse | null>(null);
  const [result, setResult] = useState<CompensationImportResultResponse | null>(null);
  const [validationIssues, setValidationIssues] = useState<
    CompensationImportValidationIssue[]
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
      const nextPreview = await previewCompensationImport(selectedFile);
      setPreview(nextPreview);

      if (!nextPreview.isValid) {
        setValidationIssues(nextPreview.errors.slice(0, MAX_VISIBLE_VALIDATION_ISSUES));
      }
    } catch (error) {
      setPreview(null);
      setValidationIssues(readCompensationImportValidationIssues(error));
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
      const nextResult = await confirmCompensationImport(selectedFile);
      setResult(nextResult);
      setPreview(null);
      setValidationIssues([]);
    } catch (error) {
      setPreview(null);
      setValidationIssues(readCompensationImportValidationIssues(error));
      setErrorMessage(
        isApiRequestError(error)
          ? error.message
          : "Import failed. Check the spreadsheet and try again.",
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
