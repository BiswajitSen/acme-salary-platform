import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SiteHeader } from "./site-header";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("./display-currency-selector", () => ({
  DisplayCurrencySelector: () => <div data-testid="display-currency-selector" />,
}));

describe("SiteHeader", () => {
  it("renders primary navigation and the global display currency selector", () => {
    render(<SiteHeader />);

    expect(screen.getByText("ACME Salary")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Analytics" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Insights" })).toBeTruthy();
    expect(screen.getByTestId("display-currency-selector")).toBeTruthy();
  });
});
