import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DisplayCurrencySelector } from "./display-currency-selector";

const { useDisplayCurrencyMock } = vi.hoisted(() => ({
  useDisplayCurrencyMock: vi.fn(),
}));

vi.mock("@/lib/hooks/use-display-currency", () => ({
  useDisplayCurrency: (...args: unknown[]) => useDisplayCurrencyMock(...args),
}));

describe("DisplayCurrencySelector", () => {
  it("renders supported display currencies", () => {
    useDisplayCurrencyMock.mockReturnValue({
      currency: "USD",
      selectCurrency: vi.fn(),
      isReady: true,
    });

    render(<DisplayCurrencySelector />);

    expect(screen.getByLabelText("Display currency")).toBeTruthy();
    expect(screen.getByRole("option", { name: "GBP" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "SGD" })).toBeTruthy();
  });

  it("updates the shared display currency preference", async () => {
    const selectCurrency = vi.fn();
    useDisplayCurrencyMock.mockReturnValue({
      currency: "USD",
      selectCurrency,
      isReady: true,
    });

    render(<DisplayCurrencySelector />);

    await userEvent.selectOptions(screen.getByLabelText("Display currency"), "EUR");

    expect(selectCurrency).toHaveBeenCalledWith("EUR");
  });
});
