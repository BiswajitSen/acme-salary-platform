import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ApiRequestError } from "@/lib/api/client";
import { useEmployeeProfile } from "./use-employee-profile";

const { getEmployeeProfile, listEmployeeCompensationHistory } = vi.hoisted(() => ({
  getEmployeeProfile: vi.fn(),
  listEmployeeCompensationHistory: vi.fn(),
}));

vi.mock("@/lib/api/employees", () => ({
  getEmployeeProfile,
  listEmployeeCompensationHistory,
}));

describe("useEmployeeProfile", () => {
  it("loads profile and compensation history", async () => {
    getEmployeeProfile.mockResolvedValue({
      id: "E001",
      fullName: "Jane Doe",
      department: "Engineering",
      jobTitle: "Senior Engineer",
      country: "US",
      currentCompensation: null,
    });
    listEmployeeCompensationHistory.mockResolvedValue({
      employeeId: "E001",
      entries: [],
    });

    const { result } = renderHook(() => useEmployeeProfile("E001"));

    await waitFor(() => {
      expect(result.current.profile?.fullName).toBe("Jane Doe");
    });
  });

  it("marks missing employees as not found", async () => {
    getEmployeeProfile.mockRejectedValue(new ApiRequestError("Not found", 404));
    listEmployeeCompensationHistory.mockRejectedValue(new ApiRequestError("Not found", 404));

    const { result } = renderHook(() => useEmployeeProfile("E404"));

    await waitFor(() => {
      expect(result.current.notFound).toBe(true);
    });
  });

  it("surfaces a generic error message for other failures", async () => {
    getEmployeeProfile.mockRejectedValue(new Error("Network error"));
    listEmployeeCompensationHistory.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useEmployeeProfile("E001"));

    await waitFor(() => {
      expect(result.current.errorMessage).toContain("Unable to load the employee profile");
    });
  });

  it("ignores late errors after the hook unmounts", async () => {
    let rejectProfile: ((reason?: unknown) => void) | undefined;

    getEmployeeProfile.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectProfile = reject;
        }),
    );
    listEmployeeCompensationHistory.mockResolvedValue({
      employeeId: "E001",
      entries: [],
    });

    const { unmount } = renderHook(() => useEmployeeProfile("E001"));
    unmount();
    rejectProfile?.(new Error("Network error"));
  });

  it("ignores late profile data after the hook unmounts", async () => {
    let resolveProfile: ((value: unknown) => void) | undefined;

    getEmployeeProfile.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveProfile = resolve;
        }),
    );
    listEmployeeCompensationHistory.mockResolvedValue({
      employeeId: "E001",
      entries: [],
    });

    const { unmount } = renderHook(() => useEmployeeProfile("E001"));
    unmount();
    resolveProfile?.({
      id: "E001",
      fullName: "Jane Doe",
      department: "Engineering",
      jobTitle: "Senior Engineer",
      country: "US",
      currentCompensation: null,
    });
  });

  it("marks missing employees as not found when reloadProfile fails with 404", async () => {
    getEmployeeProfile.mockResolvedValueOnce({
      id: "E001",
      fullName: "Jane Doe",
      department: "Engineering",
      jobTitle: "Senior Engineer",
      country: "US",
      currentCompensation: null,
    });
    listEmployeeCompensationHistory.mockResolvedValueOnce({
      employeeId: "E001",
      entries: [],
    });

    const { result } = renderHook(() => useEmployeeProfile("E001"));

    await waitFor(() => {
      expect(result.current.profile?.fullName).toBe("Jane Doe");
    });

    getEmployeeProfile.mockRejectedValue(new ApiRequestError("Not found", 404));
    listEmployeeCompensationHistory.mockRejectedValue(new ApiRequestError("Not found", 404));

    await result.current.reloadProfile();

    await waitFor(() => {
      expect(result.current.notFound).toBe(true);
      expect(result.current.profile).toBeNull();
    });
  });

  it("reloads profile data when reloadProfile is called", async () => {
    getEmployeeProfile.mockResolvedValue({
      id: "E001",
      fullName: "Jane Doe",
      department: "Engineering",
      jobTitle: "Senior Engineer",
      country: "US",
      currentCompensation: null,
    });
    listEmployeeCompensationHistory.mockResolvedValue({
      employeeId: "E001",
      entries: [],
    });

    const { result } = renderHook(() => useEmployeeProfile("E001"));

    await waitFor(() => {
      expect(result.current.profile?.fullName).toBe("Jane Doe");
    });

    getEmployeeProfile.mockResolvedValue({
      id: "E001",
      fullName: "Jane Doe",
      department: "Engineering",
      jobTitle: "Principal Engineer",
      country: "US",
      currentCompensation: null,
    });

    await result.current.reloadProfile();

    await waitFor(() => {
      expect(result.current.profile?.jobTitle).toBe("Principal Engineer");
    });
  });
});
