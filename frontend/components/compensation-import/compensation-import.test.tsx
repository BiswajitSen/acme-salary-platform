import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CompensationImport } from "./compensation-import";

const {
  previewCompensationImport,
  confirmCompensationImport,
  readCompensationImportValidationIssues,
} = vi.hoisted(() => ({
  previewCompensationImport: vi.fn(),
  confirmCompensationImport: vi.fn(),
  readCompensationImportValidationIssues: vi.fn().mockReturnValue([]),
}));

vi.mock("@/lib/api/compensation-import", () => ({
  previewCompensationImport,
  confirmCompensationImport,
  readCompensationImportValidationIssues,
}));

describe("CompensationImport", () => {
  beforeEach(() => {
    previewCompensationImport.mockReset();
    confirmCompensationImport.mockReset();
    readCompensationImportValidationIssues.mockReturnValue([]);
  });

  afterEach(() => {
    cleanup();
  });

  it("renders upload controls and required column guidance", () => {
    render(<CompensationImport />);

    expect(screen.getByLabelText("Excel file (.xlsx)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Preview import" })).toBeDisabled();
    expect(screen.getByText(/Required columns/i)).toBeInTheDocument();
  });

  it("previews a valid spreadsheet and enables confirm import", async () => {
    const user = userEvent.setup();

    previewCompensationImport.mockResolvedValue({
      recordCount: 1,
      errors: [],
      isValid: true,
    });

    render(<CompensationImport />);

    const file = new File(["spreadsheet"], "compensation.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    await user.upload(screen.getByLabelText("Excel file (.xlsx)"), file);
    await user.click(screen.getByRole("button", { name: "Preview import" }));

    expect(await screen.findByText(/All clear/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm import" })).toBeEnabled();
  });

  it("shows validation issues for invalid spreadsheets", async () => {
    const user = userEvent.setup();

    previewCompensationImport.mockResolvedValue({
      recordCount: 0,
      errors: [{ rowNumber: 2, field: "employeeId", message: "Employee ID is required" }],
      isValid: false,
    });

    render(<CompensationImport />);

    const file = new File(["spreadsheet"], "compensation.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    await user.upload(screen.getByLabelText("Excel file (.xlsx)"), file);
    await user.click(screen.getByRole("button", { name: "Preview import" }));

    expect(await screen.findByText("Employee ID is required")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm import" })).toBeDisabled();
  });

  it("completes an import and shows the result summary", async () => {
    const user = userEvent.setup();

    previewCompensationImport.mockResolvedValue({
      recordCount: 1,
      errors: [],
      isValid: true,
    });
    confirmCompensationImport.mockResolvedValue({ inserted: 1, total: 1 });

    render(<CompensationImport />);

    const file = new File(["spreadsheet"], "compensation.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    await user.upload(screen.getByLabelText("Excel file (.xlsx)"), file);
    await user.click(screen.getByRole("button", { name: "Preview import" }));
    await screen.findByText(/All clear/i);
    await user.click(screen.getByRole("button", { name: "Confirm import" }));

    await waitFor(() => {
      expect(screen.getByText(/Imported 1 compensation records/i)).toBeInTheDocument();
    });
  });

  it("shows an error alert when preview fails unexpectedly", async () => {
    const user = userEvent.setup();

    previewCompensationImport.mockRejectedValue(new Error("Network error"));

    render(<CompensationImport />);

    const file = new File(["spreadsheet"], "compensation.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    await user.upload(screen.getByLabelText("Excel file (.xlsx)"), file);
    await user.click(screen.getByRole("button", { name: "Preview import" }));

    expect(
      await screen.findByText(/Unable to preview the spreadsheet/i),
    ).toBeInTheDocument();
  });

  it("clears the selected file when the upload input is emptied", () => {
    render(<CompensationImport />);

    fireEvent.change(screen.getByLabelText("Excel file (.xlsx)"), {
      target: { files: [] },
    });

    expect(screen.queryByText(/Selected file:/i)).not.toBeInTheDocument();
  });

  it("shows loading states while previewing and importing", async () => {
    const user = userEvent.setup();
    let resolvePreview: ((value: unknown) => void) | undefined;

    previewCompensationImport.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePreview = resolve;
        }),
    );

    render(<CompensationImport />);

    const file = new File(["spreadsheet"], "compensation.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    await user.upload(screen.getByLabelText("Excel file (.xlsx)"), file);
    await user.click(screen.getByRole("button", { name: "Preview import" }));

    expect(await screen.findByText("Validating spreadsheet…")).toBeInTheDocument();

    resolvePreview?.({
      recordCount: 0,
      errors: [],
      isValid: true,
    });
  });

  it("shows an importing state while confirm is in progress", async () => {
    const user = userEvent.setup();
    let resolveConfirm: ((value: unknown) => void) | undefined;

    previewCompensationImport.mockResolvedValue({
      recordCount: 1,
      errors: [],
      isValid: true,
    });
    confirmCompensationImport.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveConfirm = resolve;
        }),
    );

    render(<CompensationImport />);

    const file = new File(["spreadsheet"], "compensation.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    await user.upload(screen.getByLabelText("Excel file (.xlsx)"), file);
    await user.click(screen.getByRole("button", { name: "Preview import" }));
    await screen.findByText(/All clear/i);
    await user.click(screen.getByRole("button", { name: "Confirm import" }));

    expect(await screen.findByRole("button", { name: "Importing…" })).toBeDisabled();

    resolveConfirm?.({ inserted: 1, total: 1 });
  });

  it("shows validation issues after confirm fails with row details", async () => {
    const user = userEvent.setup();

    previewCompensationImport.mockResolvedValue({
      recordCount: 1,
      errors: [],
      isValid: true,
    });
    confirmCompensationImport.mockRejectedValue(new Error("Import failed"));
    readCompensationImportValidationIssues.mockReturnValue([
      { rowNumber: 2, field: "employeeId", message: "Employee ID is required" },
    ]);

    render(<CompensationImport />);

    const file = new File(["spreadsheet"], "compensation.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    await user.upload(screen.getByLabelText("Excel file (.xlsx)"), file);
    await user.click(screen.getByRole("button", { name: "Preview import" }));
    await screen.findByText(/All clear/i);
    await user.click(screen.getByRole("button", { name: "Confirm import" }));

    expect(await screen.findByText("Employee ID is required")).toBeInTheDocument();
    expect(screen.queryByText(/All clear/i)).not.toBeInTheDocument();
  });

  it("resets the form after a successful import", async () => {
    const user = userEvent.setup();

    previewCompensationImport.mockResolvedValue({
      recordCount: 1,
      errors: [],
      isValid: true,
    });
    confirmCompensationImport.mockResolvedValue({ inserted: 1, total: 1 });

    render(<CompensationImport />);

    const file = new File(["spreadsheet"], "compensation.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    await user.upload(screen.getByLabelText("Excel file (.xlsx)"), file);
    await user.click(screen.getByRole("button", { name: "Preview import" }));
    await screen.findByText(/All clear/i);
    await user.click(screen.getByRole("button", { name: "Confirm import" }));
    await screen.findByText(/Imported 1 compensation records/i);
    await user.click(screen.getByRole("button", { name: "Import another file" }));

    expect(screen.queryByText(/Imported 1 compensation records/i)).not.toBeInTheDocument();
  });
});
