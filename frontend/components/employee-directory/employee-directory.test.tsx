import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EmployeeDirectory } from "./employee-directory";

vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: (options: {
    getScrollElement: () => unknown;
    estimateSize: () => number;
    count: number;
  }) => {
    options.getScrollElement();
    options.estimateSize();

    return {
      getTotalSize: () => 48,
      getVirtualItems: () => [
        { index: 0, start: 0 },
        { index: options.count, start: 48 },
      ],
    };
  },
}));

const { listEmployees, listEmployeeFilterOptions } = vi.hoisted(() => ({
  listEmployees: vi.fn(),
  listEmployeeFilterOptions: vi.fn(),
}));

vi.mock("@/lib/api/employees", () => ({
  listEmployees,
  listEmployeeFilterOptions,
}));

describe("EmployeeDirectory", () => {
  beforeEach(() => {
    listEmployees.mockReset();
    listEmployeeFilterOptions.mockReset();
    listEmployees.mockResolvedValue({
      data: [
        {
          id: "E001",
          fullName: "Jane Doe",
          department: "Engineering",
          jobTitle: "Senior Engineer",
          country: "US",
        },
      ],
      meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
    });
    listEmployeeFilterOptions.mockResolvedValue({
      countries: ["US"],
      departments: ["Engineering"],
      jobTitles: ["Senior Engineer"],
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("renders employees and filter controls", async () => {
    render(<EmployeeDirectory />);

    expect(await screen.findByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByLabelText("Search employees")).toBeInTheDocument();
    expect(screen.getByLabelText("Filter by country")).toBeInTheDocument();
  });

  it("shows an empty state when no employees match", async () => {
    listEmployees.mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 50, total: 0, totalPages: 0 },
    });

    render(<EmployeeDirectory />);

    expect(
      await screen.findByText("No employees match the current filters."),
    ).toBeInTheDocument();
  });

  it("shows an error when employee loading fails", async () => {
    listEmployees.mockRejectedValue(new Error("Network error"));

    render(<EmployeeDirectory />);

    expect(
      await screen.findByText("Unable to load employees. Is the backend running?"),
    ).toBeInTheDocument();
  });

  it("shows an error when filter options fail to load", async () => {
    listEmployeeFilterOptions.mockRejectedValue(new Error("Network error"));

    render(<EmployeeDirectory />);

    expect(await screen.findByText("Unable to load filter options.")).toBeInTheDocument();
  });

  it("requests the next page when pagination is used", async () => {
    listEmployees.mockResolvedValue({
      data: [
        {
          id: "E001",
          fullName: "Jane Doe",
          department: "Engineering",
          jobTitle: "Senior Engineer",
          country: "US",
        },
      ],
      meta: { page: 1, limit: 50, total: 2, totalPages: 2 },
    });

    render(<EmployeeDirectory />);
    await screen.findByText("Jane Doe");

    await userEvent.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(listEmployees).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 }),
      );
    });
  });

  it("returns to the previous page", async () => {
    listEmployees.mockResolvedValue({
      data: [
        {
          id: "E001",
          fullName: "Jane Doe",
          department: "Engineering",
          jobTitle: "Senior Engineer",
          country: "US",
        },
      ],
      meta: { page: 1, limit: 50, total: 2, totalPages: 2 },
    });

    render(<EmployeeDirectory />);
    await screen.findByText("Jane Doe");

    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await userEvent.click(screen.getByRole("button", { name: "Previous" }));

    await waitFor(() => {
      expect(listEmployees).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1 }),
      );
    });
  });

  it("updates the search input", async () => {
    render(<EmployeeDirectory />);
    await screen.findByText("Jane Doe");

    await userEvent.type(screen.getByLabelText("Search employees"), "Ann");

    expect(screen.getByLabelText("Search employees")).toHaveValue("Ann");
  });

  it("resets to page one when a filter changes", async () => {
    render(<EmployeeDirectory />);
    await screen.findByText("Jane Doe");

    await userEvent.selectOptions(screen.getByLabelText("Filter by country"), "US");

    await waitFor(() => {
      expect(listEmployees).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, country: "US" }),
      );
    });
  });

  it("filters by department and job title", async () => {
    render(<EmployeeDirectory />);
    await screen.findByText("Jane Doe");

    await userEvent.selectOptions(
      screen.getByLabelText("Filter by department"),
      "Engineering",
    );
    await userEvent.selectOptions(
      screen.getByLabelText("Filter by job title"),
      "Senior Engineer",
    );

    await waitFor(() => {
      expect(listEmployees).toHaveBeenCalledWith(
        expect.objectContaining({
          department: "Engineering",
          jobTitle: "Senior Engineer",
        }),
      );
    });
  });
});
