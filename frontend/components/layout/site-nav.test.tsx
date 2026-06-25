import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SiteNav } from "./site-nav";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

import { usePathname } from "next/navigation";

describe("SiteNav", () => {
  it("highlights only Import Compensation on the compensation import route", () => {
    vi.mocked(usePathname).mockReturnValue("/import/compensation");

    render(<SiteNav />);

    expect(screen.getByRole("link", { name: "Import Employees" }).getAttribute("aria-current")).toBeNull();
    expect(screen.getByRole("link", { name: "Import Compensation" }).getAttribute("aria-current")).toBe(
      "page",
    );
  });

  it("highlights only Import Employees on the employee import route", () => {
    vi.mocked(usePathname).mockReturnValue("/import");

    render(<SiteNav />);

    expect(screen.getByRole("link", { name: "Import Employees" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Import Compensation" }).getAttribute("aria-current")).toBeNull();
  });
});
