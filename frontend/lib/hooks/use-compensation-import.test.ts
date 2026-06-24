import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiRequestError } from "@/lib/api/client";

import { useCompensationImport } from "./use-compensation-import";

const {
  previewCompensationImport,
  confirmCompensationImport,
  readCompensationImportValidationIssues,
} = vi.hoisted(() => ({
  previewCompensationImport: vi.fn(),
  confirmCompensationImport: vi.fn(),
  readCompensationImportValidationIssues: vi.fn(),
}));

vi.mock("@/lib/api/compensation-import", () => ({
  previewCompensationImport,
  confirmCompensationImport,
  readCompensationImportValidationIssues,
}));

describe("useCompensationImport", () => {
  beforeEach(() => {
    previewCompensationImport.mockReset();
    confirmCompensationImport.mockReset();
    readCompensationImportValidationIssues.mockReset();
    readCompensationImportValidationIssues.mockReturnValue([]);
  });

  it("previews a selected spreadsheet and stores validation results", async () => {
    const file = new File(["spreadsheet"], "compensation.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    previewCompensationImport.mockResolvedValue({
      recordCount: 1,
      errors: [],
      isValid: true,
    });

    const { result } = renderHook(() => useCompensationImport());

    act(() => {
      result.current.selectFile(file);
    });

    await act(async () => {
      await result.current.previewImport();
    });

    await waitFor(() => {
      expect(result.current.preview?.isValid).toBe(true);
    });
    expect(previewCompensationImport).toHaveBeenCalledWith(file);
  });

  it("confirms a valid import and stores the result", async () => {
    const file = new File(["spreadsheet"], "compensation.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    previewCompensationImport.mockResolvedValue({
      recordCount: 1,
      errors: [],
      isValid: true,
    });
    confirmCompensationImport.mockResolvedValue({ inserted: 1, total: 1 });

    const { result } = renderHook(() => useCompensationImport());

    act(() => {
      result.current.selectFile(file);
    });

    await act(async () => {
      await result.current.previewImport();
      await result.current.confirmImport();
    });

    await waitFor(() => {
      expect(result.current.result?.total).toBe(1);
    });
    expect(result.current.preview).toBeNull();
  });

  it("surfaces validation issues when preview fails", async () => {
    const file = new File(["spreadsheet"], "compensation.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    previewCompensationImport.mockRejectedValue(new Error("Invalid spreadsheet"));
    readCompensationImportValidationIssues.mockReturnValue([
      { rowNumber: 2, field: "employeeId", message: "Employee ID is required" },
    ]);

    const { result } = renderHook(() => useCompensationImport());

    act(() => {
      result.current.selectFile(file);
    });

    await act(async () => {
      await result.current.previewImport();
    });

    await waitFor(() => {
      expect(result.current.validationIssues).toHaveLength(1);
    });
    expect(result.current.errorMessage).toContain("Unable to preview");
  });

  it("requires a file before previewing", async () => {
    const { result } = renderHook(() => useCompensationImport());

    await act(async () => {
      await result.current.previewImport();
    });

    expect(result.current.errorMessage).toContain("Choose an Excel file");
  });

  it("requires a file before confirming", async () => {
    const { result } = renderHook(() => useCompensationImport());

    await act(async () => {
      await result.current.confirmImport();
    });

    expect(result.current.errorMessage).toContain("Choose an Excel file");
  });

  it("stores preview validation issues for invalid spreadsheets", async () => {
    const file = new File(["spreadsheet"], "compensation.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    previewCompensationImport.mockResolvedValue({
      recordCount: 0,
      errors: [{ rowNumber: 2, field: "employeeId", message: "Employee ID is required" }],
      isValid: false,
    });

    const { result } = renderHook(() => useCompensationImport());

    act(() => {
      result.current.selectFile(file);
    });

    await act(async () => {
      await result.current.previewImport();
    });

    await waitFor(() => {
      expect(result.current.validationIssues).toHaveLength(1);
    });
  });

  it("surfaces api error messages when confirm fails", async () => {
    const file = new File(["spreadsheet"], "compensation.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    confirmCompensationImport.mockRejectedValue(
      new ApiRequestError("Database connection refused", 500),
    );
    readCompensationImportValidationIssues.mockReturnValue([]);

    const { result } = renderHook(() => useCompensationImport());

    act(() => {
      result.current.selectFile(file);
    });

    await act(async () => {
      await result.current.confirmImport();
    });

    await waitFor(() => {
      expect(result.current.errorMessage).toBe("Database connection refused");
    });
    expect(result.current.preview).toBeNull();
  });

  it("uses a generic message when confirm fails without an api error", async () => {
    const file = new File(["spreadsheet"], "compensation.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    confirmCompensationImport.mockRejectedValue(new Error("Network error"));
    readCompensationImportValidationIssues.mockReturnValue([]);

    const { result } = renderHook(() => useCompensationImport());

    act(() => {
      result.current.selectFile(file);
    });

    await act(async () => {
      await result.current.confirmImport();
    });

    await waitFor(() => {
      expect(result.current.errorMessage).toContain("Import failed");
    });
  });

  it("clears state when resetImport is called", async () => {
    const file = new File(["spreadsheet"], "compensation.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    previewCompensationImport.mockResolvedValue({
      recordCount: 0,
      errors: [],
      isValid: true,
    });

    const { result } = renderHook(() => useCompensationImport());

    act(() => {
      result.current.selectFile(file);
    });

    await act(async () => {
      await result.current.previewImport();
    });

    act(() => {
      result.current.resetImport();
    });

    expect(result.current.selectedFile).toBeNull();
    expect(result.current.preview).toBeNull();
  });
});
