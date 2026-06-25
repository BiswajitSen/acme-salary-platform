import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiRequestError } from "@/lib/api/client";
import { EmployeeProfile } from "./employee-profile";

const { getEmployeeProfile, listEmployeeCompensationHistory, recordCompensationChange } =
  vi.hoisted(() => ({
    getEmployeeProfile: vi.fn(),
    listEmployeeCompensationHistory: vi.fn(),
    recordCompensationChange: vi.fn(),
  }));

const { useEmployeeProfileMock, useExchangeRatesMock } = vi.hoisted(() => ({
  useEmployeeProfileMock: vi.fn(),
  useExchangeRatesMock: vi.fn(),
}));

vi.mock("@/lib/hooks/use-display-currency", () => ({
  useDisplayCurrency: () => ({
    currency: "USD",
    selectCurrency: vi.fn(),
    isReady: true,
  }),
}));

vi.mock("@/lib/hooks/use-exchange-rates", () => ({
  useExchangeRates: (...args: unknown[]) => useExchangeRatesMock(...args),
}));

vi.mock("@/lib/hooks/use-employee-profile", async () => {
  const actual = await vi.importActual<typeof import("@/lib/hooks/use-employee-profile")>(
    "@/lib/hooks/use-employee-profile",
  );

  return {
    ...actual,
    useEmployeeProfile: (...args: Parameters<typeof actual.useEmployeeProfile>) => {
      if (useEmployeeProfileMock.getMockImplementation()) {
        return useEmployeeProfileMock(...args);
      }

      return actual.useEmployeeProfile(...args);
    },
  };
});

vi.mock("@/lib/api/employees", () => ({
  getEmployeeProfile,
  listEmployeeCompensationHistory,
  recordCompensationChange,
}));

describe("EmployeeProfile", () => {
  afterEach(() => {
    cleanup();
    useEmployeeProfileMock.mockReset();
    useExchangeRatesMock.mockReset();
  });

  beforeEach(() => {
    useExchangeRatesMock.mockReturnValue({
      ratesToUsd: {
        USD: 1,
        GBP: 1.25,
        EUR: 1.1,
        INR: 0.012,
        SGD: 0.75,
      },
      exchangeRatesAsOf: "2026-01-01",
      isLoading: false,
    });
  });

  it("renders profile sections for a loaded employee", async () => {
    getEmployeeProfile.mockResolvedValue({
      id: "E001",
      fullName: "Jane Doe",
      department: "Engineering",
      jobTitle: "Senior Engineer",
      country: "US",
      currentCompensation: {
        baseSalary: 132_000,
        currency: "USD",
        effectiveDate: "2025-01-01",
        reason: "Annual Increment",
        changedBy: "HR Admin",
        lastUpdated: "2025-01-02T10:00:00.000Z",
      },
    });
    listEmployeeCompensationHistory.mockResolvedValue({
      employeeId: "E001",
      entries: [
        {
          id: 2,
          previousSalary: 120_000,
          baseSalary: 132_000,
          currency: "USD",
          effectiveDate: "2025-01-01",
          reason: "Annual Increment",
          changedBy: "HR Admin",
          notes: null,
          createdAt: "2025-01-02T10:00:00.000Z",
        },
      ],
    });

    render(<EmployeeProfile employeeId="E001" />);

    expect(await screen.findByRole("heading", { name: "Jane Doe" })).toBeInTheDocument();
    expect(await screen.findByText("Compensation timeline")).toBeInTheDocument();
    expect(screen.getAllByText("$132,000").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Back to directory" })).toHaveAttribute("href", "/");
  });

  it("shows a not found message for missing employees", async () => {
    getEmployeeProfile.mockRejectedValue(new ApiRequestError("Not found", 404));
    listEmployeeCompensationHistory.mockRejectedValue(new ApiRequestError("Not found", 404));

    render(<EmployeeProfile employeeId="E404" />);

    expect(await screen.findByText(/Employee E404 was not found/i)).toBeInTheDocument();
  });

  it("shows an error message when profile loading fails", async () => {
    getEmployeeProfile.mockRejectedValue(new Error("Network error"));
    listEmployeeCompensationHistory.mockRejectedValue(new Error("Network error"));

    render(<EmployeeProfile employeeId="E001" />);

    expect(
      await screen.findByText(/Unable to load the employee profile/i),
    ).toBeInTheDocument();
  });

  it("renders an empty timeline when compensation history is unavailable", () => {
    useEmployeeProfileMock.mockReturnValue({
      profile: {
        id: "E001",
        fullName: "Jane Doe",
        department: "Engineering",
        jobTitle: "Senior Engineer",
        country: "US",
        currentCompensation: null,
      },
      compensationHistory: null,
      isLoading: false,
      errorMessage: null,
      notFound: false,
      reloadProfile: vi.fn(),
    });

    render(<EmployeeProfile employeeId="E001" />);

    expect(screen.getByText(/No compensation changes recorded yet/i)).toBeInTheDocument();
  });

  it("shows a loading message while exchange rates are fetched", () => {
    useEmployeeProfileMock.mockReturnValue({
      profile: {
        id: "E001",
        fullName: "Jane Doe",
        department: "Engineering",
        jobTitle: "Senior Engineer",
        country: "US",
        currentCompensation: null,
      },
      compensationHistory: { employeeId: "E001", entries: [] },
      isLoading: false,
      errorMessage: null,
      notFound: false,
      reloadProfile: vi.fn(),
    });
    useExchangeRatesMock.mockReturnValue({
      ratesToUsd: null,
      exchangeRatesAsOf: null,
      isLoading: true,
    });

    render(<EmployeeProfile employeeId="E001" />);

    expect(screen.getByText(/Loading exchange rates/i)).toBeInTheDocument();
  });

  it("shows recorded-currency salaries when exchange rates are unavailable", () => {
    useEmployeeProfileMock.mockReturnValue({
      profile: {
        id: "E001",
        fullName: "Jane Doe",
        department: "Engineering",
        jobTitle: "Senior Engineer",
        country: "US",
        currentCompensation: {
          baseSalary: 86_300,
          currency: "SGD",
          effectiveDate: "2025-01-01",
          reason: "Annual Increment",
          changedBy: "HR Admin",
          lastUpdated: "2025-01-02T10:00:00.000Z",
        },
      },
      compensationHistory: { employeeId: "E001", entries: [] },
      isLoading: false,
      errorMessage: null,
      notFound: false,
      reloadProfile: vi.fn(),
    });
    useExchangeRatesMock.mockReturnValue({
      ratesToUsd: null,
      exchangeRatesAsOf: null,
      isLoading: false,
    });

    render(<EmployeeProfile employeeId="E001" />);

    expect(
      screen.getByText(/Exchange rates are unavailable/i),
    ).toBeInTheDocument();
    expect(screen.getByText("SGD 86,300")).toBeInTheDocument();
  });

  it("reloads the profile after a compensation change is recorded", async () => {
    const reloadProfile = vi.fn().mockResolvedValue(undefined);

    useEmployeeProfileMock.mockReturnValue({
      profile: {
        id: "E001",
        fullName: "Jane Doe",
        department: "Engineering",
        jobTitle: "Senior Engineer",
        country: "US",
        currentCompensation: null,
      },
      compensationHistory: { employeeId: "E001", entries: [] },
      isLoading: false,
      errorMessage: null,
      notFound: false,
      reloadProfile,
    });
    recordCompensationChange.mockResolvedValue({
      entry: {
        id: 3,
        previousSalary: null,
        baseSalary: 140_000,
        currency: "USD",
        effectiveDate: "2026-06-01",
        reason: "Promotion",
        changedBy: "HR Admin",
        notes: null,
        createdAt: "2026-06-02T10:00:00.000Z",
      },
    });

    const user = userEvent.setup();
    render(<EmployeeProfile employeeId="E001" />);

    await user.type(screen.getByLabelText("Base salary"), "140000");
    await user.type(screen.getByLabelText("Currency"), "USD");
    fireEvent.change(screen.getByLabelText("Effective date"), {
      target: { value: "2026-06-01" },
    });
    await user.selectOptions(screen.getByLabelText("Reason"), "Promotion");
    await user.type(screen.getByLabelText("Changed by"), "HR Admin");
    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() => {
      expect(reloadProfile).toHaveBeenCalledOnce();
    });
  });
});
