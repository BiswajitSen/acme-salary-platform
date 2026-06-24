import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useEmployeeImport } from "./use-employee-import";

const {
  previewEmployeeImport,
  confirmEmployeeImport,
  readEmployeeImportValidationIssues,
} = vi.hoisted(() => ({
  previewEmployeeImport: vi.fn(),
  confirmEmployeeImport: vi.fn(),
  readEmployeeImportValidationIssues: vi.fn(),
}));

vi.mock("@/lib/api/employee-import", () => ({
  previewEmployeeImport,
  confirmEmployeeImport,
  readEmployeeImportValidationIssues,
}));

describe("useEmployeeImport", () => {
  it("previews a selected spreadsheet and stores validation results", async () => {
    const file = new File(["spreadsheet"], "employees.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    previewEmployeeImport.mockResolvedValue({
      employees: [{ id: "E001", fullName: "Jane Doe", department: "HR", jobTitle: "Manager", country: "US" }],
      errors: [],
      isValid: true,
    });

    const { result } = renderHook(() => useEmployeeImport());

    act(() => {
      result.current.selectFile(file);
    });

    await act(async () => {
      await result.current.previewImport();
    });

    await waitFor(() => {
      expect(result.current.preview?.isValid).toBe(true);
    });
    expect(previewEmployeeImport).toHaveBeenCalledWith(file);
  });

  it("confirms a valid import and stores the result", async () => {
    const file = new File(["spreadsheet"], "employees.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    previewEmployeeImport.mockResolvedValue({
      employees: [{ id: "E001", fullName: "Jane Doe", department: "HR", jobTitle: "Manager", country: "US" }],
      errors: [],
      isValid: true,
    });
    confirmEmployeeImport.mockResolvedValue({ inserted: 1, updated: 0, total: 1 });

    const { result } = renderHook(() => useEmployeeImport());

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
  });

  it("surfaces validation issues when preview fails", async () => {
    const file = new File(["spreadsheet"], "employees.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    previewEmployeeImport.mockRejectedValue(new Error("Invalid spreadsheet"));
    readEmployeeImportValidationIssues.mockReturnValue([
      { rowNumber: 2, field: "id", message: "Employee ID is required" },
    ]);

    const { result } = renderHook(() => useEmployeeImport());

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
    const { result } = renderHook(() => useEmployeeImport());

    await act(async () => {
      await result.current.previewImport();
    });

    expect(result.current.errorMessage).toContain("Choose an Excel file");
  });

  it("requires a file before confirming", async () => {
    const { result } = renderHook(() => useEmployeeImport());

    await act(async () => {
      await result.current.confirmImport();
    });

    expect(result.current.errorMessage).toContain("Choose an Excel file");
  });

  it("stores preview validation issues for invalid spreadsheets", async () => {
    const file = new File(["spreadsheet"], "employees.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    previewEmployeeImport.mockResolvedValue({
      employees: [],
      errors: [{ rowNumber: 2, field: "id", message: "Employee ID is required" }],
      isValid: false,
    });

    const { result } = renderHook(() => useEmployeeImport());

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

  it("surfaces validation issues when confirm fails", async () => {
    const file = new File(["spreadsheet"], "employees.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    confirmEmployeeImport.mockRejectedValue(new Error("Import failed"));
    readEmployeeImportValidationIssues.mockReturnValue([
      { rowNumber: 2, field: "id", message: "Employee ID is required" },
    ]);

    const { result } = renderHook(() => useEmployeeImport());

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
    const file = new File(["spreadsheet"], "employees.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    previewEmployeeImport.mockResolvedValue({
      employees: [],
      errors: [],
      isValid: true,
    });

    const { result } = renderHook(() => useEmployeeImport());

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
