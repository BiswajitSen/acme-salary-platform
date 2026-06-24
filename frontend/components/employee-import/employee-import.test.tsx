import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EmployeeImport } from "./employee-import";

const {
  previewEmployeeImport,
  confirmEmployeeImport,
  readEmployeeImportValidationIssues,
} = vi.hoisted(() => ({
  previewEmployeeImport: vi.fn(),
  confirmEmployeeImport: vi.fn(),
  readEmployeeImportValidationIssues: vi.fn().mockReturnValue([]),
}));

vi.mock("@/lib/api/employee-import", () => ({
  previewEmployeeImport,
  confirmEmployeeImport,
  readEmployeeImportValidationIssues,
}));

describe("EmployeeImport", () => {
  beforeEach(() => {
    previewEmployeeImport.mockReset();
    confirmEmployeeImport.mockReset();
    readEmployeeImportValidationIssues.mockReturnValue([]);
  });

  afterEach(() => {
    cleanup();
  });

  it("renders upload controls and required column guidance", () => {
    render(<EmployeeImport />);

    expect(screen.getByLabelText("Excel file (.xlsx)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Preview import" })).toBeDisabled();
    expect(screen.getByText(/Required columns/i)).toBeInTheDocument();
  });

  it("previews a valid spreadsheet and enables confirm import", async () => {
    const user = userEvent.setup();

    previewEmployeeImport.mockResolvedValue({
      employees: [
        {
          id: "E001",
          fullName: "Jane Doe",
          department: "Engineering",
          jobTitle: "Senior Engineer",
          country: "US",
        },
      ],
      errors: [],
      isValid: true,
    });

    render(<EmployeeImport />);

    const fileInput = screen.getByLabelText("Excel file (.xlsx)");
    const file = new File(["spreadsheet"], "employees.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    await user.upload(fileInput, file);
    await user.click(screen.getByRole("button", { name: "Preview import" }));

    expect(await screen.findByText(/All clear/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm import" })).toBeEnabled();
  });

  it("shows validation issues for invalid spreadsheets", async () => {
    const user = userEvent.setup();

    previewEmployeeImport.mockResolvedValue({
      employees: [],
      errors: [{ rowNumber: 2, field: "id", message: "Employee ID is required" }],
      isValid: false,
    });

    render(<EmployeeImport />);

    const file = new File(["spreadsheet"], "employees.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    await user.upload(screen.getByLabelText("Excel file (.xlsx)"), file);
    await user.click(screen.getByRole("button", { name: "Preview import" }));

    expect(await screen.findByText("Employee ID is required")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm import" })).toBeDisabled();
  });

  it("completes an import and shows the result summary", async () => {
    const user = userEvent.setup();

    previewEmployeeImport.mockResolvedValue({
      employees: [
        {
          id: "E001",
          fullName: "Jane Doe",
          department: "Engineering",
          jobTitle: "Senior Engineer",
          country: "US",
        },
      ],
      errors: [],
      isValid: true,
    });
    confirmEmployeeImport.mockResolvedValue({ inserted: 1, updated: 0, total: 1 });

    render(<EmployeeImport />);

    const file = new File(["spreadsheet"], "employees.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    await user.upload(screen.getByLabelText("Excel file (.xlsx)"), file);
    await user.click(screen.getByRole("button", { name: "Preview import" }));
    await screen.findByText(/All clear/i);
    await user.click(screen.getByRole("button", { name: "Confirm import" }));

    await waitFor(() => {
      expect(screen.getByText(/Imported 1 employees/i)).toBeInTheDocument();
    });
  });

  it("shows an error alert when preview fails unexpectedly", async () => {
    const user = userEvent.setup();

    previewEmployeeImport.mockRejectedValue(new Error("Network error"));

    render(<EmployeeImport />);

    const file = new File(["spreadsheet"], "employees.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    await user.upload(screen.getByLabelText("Excel file (.xlsx)"), file);
    await user.click(screen.getByRole("button", { name: "Preview import" }));

    expect(
      await screen.findByText(/Unable to preview the spreadsheet/i),
    ).toBeInTheDocument();
  });

  it("clears the selected file when the upload input is emptied", () => {
    render(<EmployeeImport />);

    fireEvent.change(screen.getByLabelText("Excel file (.xlsx)"), {
      target: { files: [] },
    });

    expect(screen.queryByText(/Selected file:/i)).not.toBeInTheDocument();
  });

  it("shows loading states while previewing and importing", async () => {
    const user = userEvent.setup();
    let resolvePreview: ((value: unknown) => void) | undefined;

    previewEmployeeImport.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePreview = resolve;
        }),
    );

    render(<EmployeeImport />);

    const file = new File(["spreadsheet"], "employees.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    await user.upload(screen.getByLabelText("Excel file (.xlsx)"), file);
    await user.click(screen.getByRole("button", { name: "Preview import" }));

    expect(await screen.findByText("Validating spreadsheet…")).toBeInTheDocument();

    resolvePreview?.({
      employees: [],
      errors: [],
      isValid: true,
    });
  });

  it("shows an importing state while confirm is in progress", async () => {
    const user = userEvent.setup();
    let resolveConfirm: ((value: unknown) => void) | undefined;

    previewEmployeeImport.mockResolvedValue({
      employees: [
        {
          id: "E001",
          fullName: "Jane Doe",
          department: "Engineering",
          jobTitle: "Senior Engineer",
          country: "US",
        },
      ],
      errors: [],
      isValid: true,
    });
    confirmEmployeeImport.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveConfirm = resolve;
        }),
    );

    render(<EmployeeImport />);

    const file = new File(["spreadsheet"], "employees.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    await user.upload(screen.getByLabelText("Excel file (.xlsx)"), file);
    await user.click(screen.getByRole("button", { name: "Preview import" }));
    await screen.findByText(/All clear/i);
    await user.click(screen.getByRole("button", { name: "Confirm import" }));

    expect(await screen.findByRole("button", { name: "Importing…" })).toBeDisabled();

    resolveConfirm?.({ inserted: 1, updated: 0, total: 1 });
  });

  it("resets the form after a successful import", async () => {
    const user = userEvent.setup();

    previewEmployeeImport.mockResolvedValue({
      employees: [
        {
          id: "E001",
          fullName: "Jane Doe",
          department: "Engineering",
          jobTitle: "Senior Engineer",
          country: "US",
        },
      ],
      errors: [],
      isValid: true,
    });
    confirmEmployeeImport.mockResolvedValue({ inserted: 1, updated: 0, total: 1 });

    render(<EmployeeImport />);

    const file = new File(["spreadsheet"], "employees.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    await user.upload(screen.getByLabelText("Excel file (.xlsx)"), file);
    await user.click(screen.getByRole("button", { name: "Preview import" }));
    await screen.findByText(/All clear/i);
    await user.click(screen.getByRole("button", { name: "Confirm import" }));
    await screen.findByText(/Imported 1 employees/i);
    await user.click(screen.getByRole("button", { name: "Import another file" }));

    expect(screen.queryByText(/Imported 1 employees/i)).not.toBeInTheDocument();
  });
});
