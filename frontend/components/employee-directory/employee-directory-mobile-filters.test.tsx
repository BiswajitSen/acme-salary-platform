import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EmployeeDirectoryMobileFilters } from "./employee-directory-mobile-filters";
import { emptyDirectoryFilters } from "./types";

const filterOptions = {
  countries: ["US", "IN"],
  departments: ["Engineering", "Sales"],
  jobTitles: ["Senior Engineer", "Manager"],
};

describe("EmployeeDirectoryMobileFilters", () => {
  it("renders sheet filters for each directory column", () => {
    render(
      <EmployeeDirectoryMobileFilters
        filters={emptyDirectoryFilters}
        filterOptions={filterOptions}
        onFilterChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Department")).toBeInTheDocument();
    expect(screen.getByText("Job title")).toBeInTheDocument();
    expect(screen.getByText("Country")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Filter by department" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Filter by employment status" })).toBeInTheDocument();
  });

  it("forwards applied filter values to onFilterChange", async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();

    render(
      <EmployeeDirectoryMobileFilters
        filters={emptyDirectoryFilters}
        filterOptions={filterOptions}
        onFilterChange={onFilterChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Filter by department" }));
    let dialog = screen.getByRole("dialog", { name: "Filter by department" });
    await user.click(within(dialog).getByRole("checkbox", { name: "Sales" }));
    await user.click(within(dialog).getByRole("button", { name: "OK" }));
    expect(onFilterChange).toHaveBeenCalledWith("departments", ["Engineering"]);

    await user.click(screen.getByRole("button", { name: "Filter by job title" }));
    dialog = screen.getByRole("dialog", { name: "Filter by job title" });
    await user.click(within(dialog).getByRole("checkbox", { name: "Manager" }));
    await user.click(within(dialog).getByRole("button", { name: "OK" }));
    expect(onFilterChange).toHaveBeenCalledWith("jobTitles", ["Senior Engineer"]);

    await user.click(screen.getByRole("button", { name: "Filter by country" }));
    dialog = screen.getByRole("dialog", { name: "Filter by country" });
    await user.click(within(dialog).getByRole("checkbox", { name: "IN" }));
    await user.click(within(dialog).getByRole("button", { name: "OK" }));
    expect(onFilterChange).toHaveBeenCalledWith("countries", ["US"]);

    await user.click(screen.getByRole("button", { name: "Filter by employment status" }));
    dialog = screen.getByRole("dialog", { name: "Filter by employment status" });
    expect(within(dialog).getByText("No compensation")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("checkbox", { name: "No compensation" }));
    await user.click(within(dialog).getByRole("button", { name: "OK" }));
    expect(onFilterChange).toHaveBeenCalledWith("employmentStatuses", ["ACTIVE"]);
  });
});
