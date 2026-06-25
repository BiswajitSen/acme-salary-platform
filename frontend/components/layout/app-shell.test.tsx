import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AppShell } from "./app-shell";

vi.mock("./site-header", () => ({
  SiteHeader: () => <div data-testid="site-header" />,
}));

describe("AppShell", () => {
  it("wraps page content with the shared display currency provider", () => {
    render(
      <AppShell>
        <p>Page content</p>
      </AppShell>,
    );

    expect(screen.getByTestId("site-header")).toBeTruthy();
    expect(screen.getByText("Page content")).toBeTruthy();
  });
});
