import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/employees", () => ({
  createEmployee: vi.fn(),
  updateEmployee: vi.fn(),
  listEmployeeFilterOptions: vi.fn(),
}));

import { createEmployee, listEmployeeFilterOptions } from "@/lib/api/employees";
import { EmployeeForm } from "./employee-form";

const mockedCreateEmployee = vi.mocked(createEmployee);
const mockedListEmployeeFilterOptions = vi.mocked(listEmployeeFilterOptions);

describe("EmployeeForm", () => {
  beforeEach(() => {
    mockedCreateEmployee.mockReset();
    mockedListEmployeeFilterOptions.mockReset();
    mockedListEmployeeFilterOptions.mockResolvedValue({
      countries: ["US"],
      departments: ["Engineering"],
      jobTitles: ["Engineer"],
    });
  });

  it("shows validation errors when required fields are missing", async () => {
    const user = userEvent.setup();

    render(
      <EmployeeForm
        mode="create"
        title="Employee details"
        submitLabel="Create employee"
        onSuccess={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(mockedListEmployeeFilterOptions).toHaveBeenCalled();
    });

    await user.click(screen.getByRole("button", { name: "Create employee" }));

    await waitFor(() => {
      expect(screen.getByText("Employee ID is required")).toBeInTheDocument();
      expect(screen.getByText("Full name is required")).toBeInTheDocument();
    });
    expect(mockedCreateEmployee).not.toHaveBeenCalled();
  });

  it("creates an employee when the form is valid", async () => {
    const onSuccess = vi.fn();
    mockedCreateEmployee.mockResolvedValue({
      id: "E010",
      fullName: "Jane Doe",
      department: "Engineering",
      jobTitle: "Engineer",
      country: "US",
      currentCompensation: null,
    });

    const user = userEvent.setup();

    render(
      <EmployeeForm
        mode="create"
        title="Employee details"
        submitLabel="Create employee"
        onSuccess={onSuccess}
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Department")).not.toBeDisabled();
    });

    await user.type(screen.getByLabelText("Employee ID"), "E010");
    await user.type(screen.getByLabelText("Full name"), "Jane Doe");
    await user.selectOptions(screen.getByLabelText("Department"), "Engineering");
    await user.selectOptions(screen.getByLabelText("Job title"), "Engineer");
    await user.selectOptions(screen.getByLabelText("Country"), "US");
    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() => {
      expect(mockedCreateEmployee).toHaveBeenCalledWith({
        id: "E010",
        fullName: "Jane Doe",
        department: "Engineering",
        jobTitle: "Engineer",
        country: "US",
      });
    });
    expect(onSuccess).toHaveBeenCalledOnce();
  });
});
