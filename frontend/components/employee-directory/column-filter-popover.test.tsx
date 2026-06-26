import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

import { ColumnFilterPopover } from "./column-filter-popover";

const options = ["Engineering", "Sales", "Marketing"];

function renderPopover(
  props: Partial<ComponentProps<typeof ColumnFilterPopover>> = {},
) {
  const onApply = vi.fn();
  render(
    <ColumnFilterPopover
      options={options}
      appliedValues={[]}
      onApply={onApply}
      ariaLabel="Filter by department"
      {...props}
    />,
  );

  return { onApply };
}

describe("ColumnFilterPopover", () => {
  it("renders nothing when there are no options", () => {
    const { container } = render(
      <ColumnFilterPopover
        options={[]}
        appliedValues={[]}
        onApply={vi.fn()}
        ariaLabel="Filter by department"
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("opens the popover, applies a selection, and closes", async () => {
    const user = userEvent.setup();
    const { onApply } = renderPopover();

    await user.click(screen.getByRole("button", { name: "Filter by department" }));
    const dialog = screen.getByRole("dialog", { name: "Filter by department" });

    await user.click(within(dialog).getByRole("checkbox", { name: "Sales" }));
    await user.click(within(dialog).getByRole("checkbox", { name: "Marketing" }));
    await user.click(within(dialog).getByRole("button", { name: "OK" }));

    expect(onApply).toHaveBeenCalledWith(["Engineering"]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("cancels changes and closes the popover", async () => {
    const user = userEvent.setup();
    const { onApply } = renderPopover({ appliedValues: ["Engineering"] });

    await user.click(screen.getByRole("button", { name: "Filter by department" }));
    const dialog = screen.getByRole("dialog", { name: "Filter by department" });

    await user.click(within(dialog).getByRole("checkbox", { name: "Sales" }));
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(onApply).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("clears the draft selection back to all options", async () => {
    const user = userEvent.setup();
    renderPopover();

    await user.click(screen.getByRole("button", { name: "Filter by department" }));
    const dialog = screen.getByRole("dialog", { name: "Filter by department" });

    await user.click(within(dialog).getByRole("checkbox", { name: "Engineering" }));
    await user.click(within(dialog).getByRole("button", { name: "clear" }));

    expect(within(dialog).getByRole("checkbox", { name: "Select All" })).toBeChecked();
    options.forEach((option) => {
      expect(within(dialog).getByRole("checkbox", { name: option })).toBeChecked();
    });
  });

  it("toggles select all from the popover", async () => {
    const user = userEvent.setup();
    renderPopover();

    await user.click(screen.getByRole("button", { name: "Filter by department" }));
    const dialog = screen.getByRole("dialog", { name: "Filter by department" });
    const selectAll = within(dialog).getByRole("checkbox", { name: "Select All" });

    await user.click(selectAll);
    options.forEach((option) => {
      expect(within(dialog).getByRole("checkbox", { name: option })).not.toBeChecked();
    });

    await user.click(selectAll);
    options.forEach((option) => {
      expect(within(dialog).getByRole("checkbox", { name: option })).toBeChecked();
    });
  });

  it("closes the popover when clicking outside", async () => {
    const user = userEvent.setup();
    renderPopover();

    await user.click(screen.getByRole("button", { name: "Filter by department" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the popover when Escape is pressed", async () => {
    const user = userEvent.setup();
    renderPopover();

    await user.click(screen.getByRole("button", { name: "Filter by department" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("uses custom option labels", async () => {
    const user = userEvent.setup();
    renderPopover({
      options: ["ACTIVE"],
      getOptionLabel: () => "Active employees",
    });

    await user.click(screen.getByRole("button", { name: "Filter by department" }));

    expect(screen.getByText("Active employees")).toBeInTheDocument();
  });

  it("renders a bottom sheet on mobile and applies filters", async () => {
    const user = userEvent.setup();
    const { onApply } = renderPopover({
      variant: "sheet",
      sheetLabel: "Department",
    });

    await user.click(screen.getByRole("button", { name: "Filter by department" }));

    expect(screen.getByRole("heading", { name: "Department" })).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");

    const dialog = screen.getByRole("dialog", { name: "Filter by department" });
    await user.click(within(dialog).getByRole("checkbox", { name: "Engineering" }));
    await user.click(within(dialog).getByRole("checkbox", { name: "Marketing" }));
    await user.click(within(dialog).getByRole("button", { name: "OK" }));

    expect(onApply).toHaveBeenCalledWith(["Sales"]);
    expect(document.body.style.overflow).toBe("");
  });

  it("closes the sheet from the backdrop and Escape", async () => {
    const user = userEvent.setup();
    renderPopover({
      variant: "sheet",
      sheetLabel: "Department",
    });

    await user.click(screen.getByRole("button", { name: "Filter by department" }));
    await user.click(screen.getByRole("button", { name: "Close Department" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Filter by department" }));
    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("toggles the sheet closed when the trigger is clicked again", async () => {
    const user = userEvent.setup();
    renderPopover({
      variant: "sheet",
      sheetLabel: "Department",
    });

    const trigger = screen.getByRole("button", { name: "Filter by department" });
    await user.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(trigger);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders a sheet without a header label when sheetLabel is omitted", async () => {
    const user = userEvent.setup();
    renderPopover({ variant: "sheet" });

    await user.click(screen.getByRole("button", { name: "Filter by department" }));

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Filter by department" })).toBeInTheDocument();
  });

  it("opens the sheet with the applied subset selected", async () => {
    const user = userEvent.setup();
    renderPopover({
      variant: "sheet",
      sheetLabel: "Department",
      appliedValues: ["Engineering"],
    });

    await user.click(screen.getByRole("button", { name: "Filter by department" }));
    const dialog = screen.getByRole("dialog", { name: "Filter by department" });

    expect(within(dialog).getByRole("checkbox", { name: "Engineering" })).toBeChecked();
    expect(within(dialog).getByRole("checkbox", { name: "Sales" })).not.toBeChecked();
  });
});
