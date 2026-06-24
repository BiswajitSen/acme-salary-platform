import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CompensationImportPreviewPanel } from "./compensation-import-preview";

describe("CompensationImportPreviewPanel", () => {
  it("shows a success message when there are no validation issues", () => {
    const view = render(
      <CompensationImportPreviewPanel
        recordCount={250}
        validationIssues={[]}
        hiddenIssueCount={0}
      />,
    );

    expect(
      view.getByText(/250 compensation records are ready to import/i),
    ).toBeInTheDocument();
  });

  it("shows validation issues and a hidden issue summary", () => {
    const view = render(
      <CompensationImportPreviewPanel
        recordCount={0}
        validationIssues={[
          { rowNumber: 2, field: "employeeId", message: "Employee ID is required" },
        ]}
        hiddenIssueCount={3}
      />,
    );

    expect(view.getByText("Employee ID is required")).toBeInTheDocument();
    expect(view.getByText(/3 more issues not shown/i)).toBeInTheDocument();
  });
});
