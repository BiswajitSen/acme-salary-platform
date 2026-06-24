import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EmployeeImportPreviewPanel } from "./employee-import-preview";

describe("EmployeeImportPreviewPanel", () => {
  it("shows a success message when there are no validation issues", () => {
    render(
      <EmployeeImportPreviewPanel
        employeeCount={250}
        validationIssues={[]}
        hiddenIssueCount={0}
      />,
    );

    expect(screen.getByText(/250 employees are ready to import/i)).toBeInTheDocument();
  });

  it("shows validation issues and a hidden issue summary", () => {
    render(
      <EmployeeImportPreviewPanel
        employeeCount={0}
        validationIssues={[
          { rowNumber: 2, field: "id", message: "Employee ID is required" },
        ]}
        hiddenIssueCount={3}
      />,
    );

    expect(screen.getByText("Employee ID is required")).toBeInTheDocument();
    expect(screen.getByText(/3 more issues not shown/i)).toBeInTheDocument();
  });
});
