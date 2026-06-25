import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/employees", () => ({
  recordCompensationChange: vi.fn(),
}));

import { recordCompensationChange } from "@/lib/api/employees";
import { RecordCompensationChangeForm } from "./record-compensation-change-form";

const mockedRecordCompensationChange = vi.mocked(recordCompensationChange);

async function fillValidCompensationChangeForm() {
  const user = userEvent.setup();

  await user.type(screen.getByLabelText("Base salary"), "140000");
  await user.selectOptions(screen.getByLabelText("Currency"), "USD");
  fireEvent.change(screen.getByLabelText("Effective date"), {
    target: { value: "2026-06-01" },
  });
  await user.selectOptions(screen.getByLabelText("Reason"), "Annual Increment");
  await user.type(screen.getByLabelText("Changed by"), "HR Admin");

  return user;
}

describe("RecordCompensationChangeForm", () => {
  beforeEach(() => {
    mockedRecordCompensationChange.mockReset();
  });

  it("shows inline validation errors for invalid input", async () => {
    const user = userEvent.setup();

    render(<RecordCompensationChangeForm employeeId="E001" onRecorded={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Record change" }));

    await waitFor(() => {
      expect(screen.getByText("Base salary must be greater than zero")).toBeInTheDocument();
    });
    expect(mockedRecordCompensationChange).not.toHaveBeenCalled();
  });

  it("submits a valid compensation change and refreshes the profile", async () => {
    const onRecorded = vi.fn();
    mockedRecordCompensationChange.mockResolvedValue({
      entry: {
        id: 3,
        previousSalary: 120_000,
        previousCurrency: "USD",
        baseSalary: 140_000,
        currency: "USD",
        effectiveDate: "2026-06-01",
        reason: "Promotion",
        changedBy: "HR Admin",
        notes: null,
        createdAt: "2026-06-02T10:00:00.000Z",
      },
    });

    render(<RecordCompensationChangeForm employeeId="E001" onRecorded={onRecorded} />);

    await fillValidCompensationChangeForm();
    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() => {
      expect(mockedRecordCompensationChange).toHaveBeenCalledWith("E001", {
        baseSalary: 140_000,
        currency: "USD",
        effectiveDate: "2026-06-01",
        reason: "Annual Increment",
        changedBy: "HR Admin",
      });
    });
    expect(onRecorded).toHaveBeenCalledOnce();
  });

  it("shows a submit error when the API request fails", async () => {
    mockedRecordCompensationChange.mockRejectedValue(new Error("Employee E404 not found"));

    render(<RecordCompensationChangeForm employeeId="E404" onRecorded={vi.fn()} />);

    await fillValidCompensationChangeForm();
    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() => {
      expect(screen.getByText("Employee E404 not found")).toBeInTheDocument();
    });
  });

  it("shows a generic submit error for non-error rejections", async () => {
    mockedRecordCompensationChange.mockRejectedValue("unexpected failure");

    render(<RecordCompensationChangeForm employeeId="E001" onRecorded={vi.fn()} />);

    await fillValidCompensationChangeForm();
    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() => {
      expect(
        screen.getByText("Unable to record the compensation change."),
      ).toBeInTheDocument();
    });
  });

  it("clears a field error when the user edits that field", async () => {
    const user = userEvent.setup();

    render(<RecordCompensationChangeForm employeeId="E001" onRecorded={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Record change" }));

    expect(await screen.findByText("Base salary must be greater than zero")).toBeInTheDocument();

    await user.type(document.querySelector("#compensation-base-salary")!, "140000");

    expect(screen.queryByText("Base salary must be greater than zero")).not.toBeInTheDocument();
  });

  it("shows reason validation errors inline", async () => {
    render(<RecordCompensationChangeForm employeeId="E001" onRecorded={vi.fn()} />);

    await fillValidCompensationChangeForm();
    fireEvent.change(document.querySelector("#compensation-reason")!, {
      target: { value: "" },
    });
    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() => {
      expect(
        screen.getByText("Reason must be a valid compensation reason"),
      ).toBeInTheDocument();
    });
  });

  it("shows a recording state while the change is being saved", async () => {
    mockedRecordCompensationChange.mockImplementation(
      () =>
        new Promise(() => {
          /* keep pending */
        }),
    );

    render(<RecordCompensationChangeForm employeeId="E001" onRecorded={vi.fn()} />);

    await fillValidCompensationChangeForm();
    fireEvent.submit(document.querySelector("form")!);

    expect(await screen.findByRole("button", { name: "Recording…" })).toBeDisabled();
  });

  it("accepts optional notes on a valid compensation change", async () => {
    const onRecorded = vi.fn();
    mockedRecordCompensationChange.mockResolvedValue({
      entry: {
        id: 3,
        previousSalary: null,
        previousCurrency: null,
        baseSalary: 140_000,
        currency: "USD",
        effectiveDate: "2026-06-01",
        reason: "Promotion",
        changedBy: "HR Admin",
        notes: "Leadership track",
        createdAt: "2026-06-02T10:00:00.000Z",
      },
    });

    const user = userEvent.setup();
    render(<RecordCompensationChangeForm employeeId="E001" onRecorded={onRecorded} />);

    await fillValidCompensationChangeForm();
    await user.type(document.querySelector("#compensation-notes")!, "Leadership track");
    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() => {
      expect(mockedRecordCompensationChange).toHaveBeenCalledWith("E001", {
        baseSalary: 140_000,
        currency: "USD",
        effectiveDate: "2026-06-01",
        reason: "Annual Increment",
        changedBy: "HR Admin",
        notes: "Leadership track",
      });
    });
  });
});
