import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiRequestError } from "@/lib/api/client";
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

vi.mock("@/lib/hooks/use-display-currency", () => ({
  useDisplayCurrency: () => ({
    currency: "USD",
    selectCurrency: vi.fn(),
    isReady: true,
  }),
}));

vi.mock("@/lib/hooks/use-exchange-rates", () => ({
  useExchangeRates: () => ({
    ratesToUsd: {
      USD: 1,
      GBP: 1.25,
      EUR: 1.1,
      INR: 0.012,
      SGD: 0.75,
    },
    exchangeRatesAsOf: "2026-01-01",
    isLoading: false,
  }),
}));

const sampleEmployee = {
  id: "E001",
  fullName: "Jane Doe",
  department: "Engineering",
  jobTitle: "Senior Engineer",
  country: "US",
  baseSalary: 132_000,
  currency: "USD",
  employmentStatus: "ACTIVE" as const,
};

const sampleStats = {
  total: 2,
  active: 1,
  noCompensation: 1,
  departments: 1,
};

function renderEmployeeDirectory() {
  return render(<EmployeeDirectory />);
}

describe("EmployeeDirectory", () => {
  beforeEach(() => {
    listEmployees.mockReset();
    listEmployeeFilterOptions.mockReset();
    listEmployees.mockResolvedValue({
      data: [sampleEmployee],
      meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
      stats: sampleStats,
    });
    listEmployeeFilterOptions.mockResolvedValue({
      countries: ["US", "UK"],
      departments: ["Engineering", "HR"],
      jobTitles: ["Senior Engineer", "People Partner"],
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("renders employees and filter controls", async () => {
    renderEmployeeDirectory();

    expect(await screen.findByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("Total employees")).toBeInTheDocument();
    expect(screen.getByText("Missing compensation")).toBeInTheDocument();
    expect(screen.getByLabelText("Search employees")).toBeInTheDocument();
  });

  it("shows an empty state when no employees match", async () => {
    listEmployees.mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 50, total: 0, totalPages: 0 },
      stats: { total: 0, active: 0, noCompensation: 0, departments: 0 },
    });

    renderEmployeeDirectory();

    expect(await screen.findByText("No employee record found.")).toBeInTheDocument();
  });

  it("shows a filter-specific empty state when filters are active", async () => {
    listEmployees.mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 50, total: 0, totalPages: 0 },
      stats: { total: 0, active: 0, noCompensation: 0, departments: 0 },
    });

    renderEmployeeDirectory();
    await screen.findByText("No employee record found.");

    await userEvent.type(screen.getByLabelText("Search employees"), "Nobody");

    await waitFor(() => {
      expect(screen.getByText("No employees match the current filters.")).toBeInTheDocument();
    });
  });

  it("shows an error when employee loading fails", async () => {
    listEmployees.mockRejectedValue(
      new ApiRequestError("An unexpected error occurred", 500),
    );

    renderEmployeeDirectory();

    expect(
      await screen.findByText("500 Internal Server Error — Failed to load employee data."),
    ).toBeInTheDocument();
  });

  it("shows an error when filter options fail to load", async () => {
    listEmployeeFilterOptions.mockRejectedValue(new Error("Network error"));

    renderEmployeeDirectory();

    expect(await screen.findByText("Unable to load filter options.")).toBeInTheDocument();
  });

  it("requests the next page when pagination is used", async () => {
    listEmployees.mockResolvedValue({
      data: [sampleEmployee],
      meta: { page: 1, limit: 50, total: 2, totalPages: 2 },
      stats: { ...sampleStats, total: 2 },
    });

    renderEmployeeDirectory();
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
      data: [sampleEmployee],
      meta: { page: 1, limit: 50, total: 2, totalPages: 2 },
      stats: { ...sampleStats, total: 2 },
    });

    renderEmployeeDirectory();
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
    renderEmployeeDirectory();
    await screen.findByText("Jane Doe");

    await userEvent.type(screen.getByLabelText("Search employees"), "Ann");

    expect(screen.getByLabelText("Search employees")).toHaveValue("Ann");
  });

  it("resets to page one when a filter changes", async () => {
    renderEmployeeDirectory();
    await screen.findByText("Jane Doe");

    await userEvent.click(screen.getByRole("button", { name: "Filter by country" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "UK" }));
    await userEvent.click(screen.getByRole("button", { name: "OK" }));

    await waitFor(() => {
      expect(listEmployees).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, country: "US" }),
      );
    });
  });

  it("filters by department and job title", async () => {
    renderEmployeeDirectory();
    await screen.findByText("Jane Doe");

    await userEvent.click(screen.getByRole("button", { name: "Filter by department" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "HR" }));
    await userEvent.click(screen.getByRole("button", { name: "OK" }));

    await userEvent.click(screen.getByRole("button", { name: "Filter by job title" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "People Partner" }));
    await userEvent.click(screen.getByRole("button", { name: "OK" }));

    await waitFor(() => {
      expect(listEmployees).toHaveBeenCalledWith(
        expect.objectContaining({
          department: "Engineering",
          jobTitle: "Senior Engineer",
        }),
      );
    });
  });

  it("filters employees missing compensation when the KPI filter is applied", async () => {
    renderEmployeeDirectory();
    await screen.findByText("Jane Doe");

    await userEvent.click(
      screen.getByRole("button", { name: /Missing compensation/i }),
    );

    await waitFor(() => {
      expect(listEmployees).toHaveBeenCalledWith(
        expect.objectContaining({ employmentStatus: "NO_COMPENSATION" }),
      );
    });
  });
});
