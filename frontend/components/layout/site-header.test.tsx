import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("toggles the mobile navigation menu", async () => {
    render(<SiteHeader />);

    const menuButton = screen.getByRole("button", { name: "Menu" });
    await userEvent.click(menuButton);

    expect(screen.getByRole("button", { name: "Close" })).toBeTruthy();
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.getByRole("button", { name: "Menu" })).toBeTruthy();
  });

  it("closes the mobile menu when a navigation link is selected", async () => {
    render(<SiteHeader />);

    await userEvent.click(screen.getByRole("button", { name: "Menu" }));
    await userEvent.click(screen.getByRole("link", { name: "Analytics" }));

    expect(screen.getByRole("button", { name: "Menu" })).toBeTruthy();
  });

  it("closes the mobile menu when the brand link is selected", async () => {
    render(<SiteHeader />);

    await userEvent.click(screen.getByRole("button", { name: "Menu" }));
    await userEvent.click(screen.getByRole("link", { name: /ACME Salary/i }));

    expect(screen.getByRole("button", { name: "Menu" })).toBeTruthy();
  });
});
