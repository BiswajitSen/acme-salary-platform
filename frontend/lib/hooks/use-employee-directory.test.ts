import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiRequestError } from "@/lib/api/client";

const { listEmployees, listEmployeeFilterOptions } = vi.hoisted(() => ({
  listEmployees: vi.fn(),
  listEmployeeFilterOptions: vi.fn(),
}));

vi.mock("@/lib/api/employees", () => ({
  listEmployees,
  listEmployeeFilterOptions,
}));

import { useEmployeeDirectory } from "./use-employee-directory";

describe("useEmployeeDirectory", () => {
  beforeEach(() => {
    listEmployees.mockReset();
    listEmployeeFilterOptions.mockReset();
    listEmployees.mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 50, total: 0, totalPages: 0 },
      stats: { total: 0, active: 0, noCompensation: 0, departments: 0 },
    });
    listEmployeeFilterOptions.mockResolvedValue({
      countries: [],
      departments: [],
      jobTitles: [],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("loads employees on mount", async () => {
    const { result } = renderHook(() => useEmployeeDirectory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(listEmployees).toHaveBeenCalled();
    expect(listEmployeeFilterOptions).toHaveBeenCalled();
  });

  it("resets page when a filter changes", async () => {
    const { result } = renderHook(() => useEmployeeDirectory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.goToNextPage();
      result.current.updateFilter("countries", ["US"]);
    });

    await waitFor(() => {
      expect(listEmployees).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 1, country: "US" }),
      );
    });
  });

  it("stores an error when employee loading fails", async () => {
    listEmployees.mockRejectedValue(
      new ApiRequestError("An unexpected error occurred", 500),
    );

    const { result } = renderHook(() => useEmployeeDirectory());

    await waitFor(() => {
      expect(result.current.errorMessage).toBe(
        "500 Internal Server Error — Failed to load employee data.",
      );
    });
  });
});
