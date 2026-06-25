"use client";

import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  appliedFromDraftSelection,
  draftFromAppliedFilter,
  isColumnFilterActive,
} from "@/components/employee-directory/types";

import styles from "./column-filter-popover.module.css";

type ColumnFilterPopoverProps = {
  options: string[];
  appliedValues: string[];
  onApply: (values: string[]) => void;
  ariaLabel: string;
  getOptionLabel?: (option: string) => string;
};

function FilterIcon() {
  return (
    <svg
      className={styles.filterIcon}
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M2 3.25h12L9.5 9.1v4.15L6.5 14.1V9.1L2 3.25z" />
    </svg>
  );
}

export function ColumnFilterPopover({
  options,
  appliedValues,
  onApply,
  ariaLabel,
  getOptionLabel = (option) => option,
}: ColumnFilterPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draftValues, setDraftValues] = useState<string[]>([]);
  const popoverId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const isActive = isColumnFilterActive(appliedValues, options);
  const allSelected = draftValues.length === options.length;
  const selectAllChecked = options.length > 0 && allSelected;
  const selectAllIndeterminate =
    draftValues.length > 0 && draftValues.length < options.length;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = selectAllIndeterminate;
    }
  }, [selectAllIndeterminate, isOpen, draftValues]);

  function openPopover() {
    setDraftValues(draftFromAppliedFilter(appliedValues, options));
    setIsOpen(true);
  }

  function toggleValue(value: string) {
    setDraftValues((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  function toggleSelectAll() {
    setDraftValues(selectAllChecked ? [] : [...options]);
  }

  function handleApply() {
    onApply(appliedFromDraftSelection(draftValues, options));
    setIsOpen(false);
  }

  function handleCancel() {
    setIsOpen(false);
  }

  function handleClear() {
    setDraftValues([...options]);
  }

  if (options.length === 0) {
    return null;
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={isActive ? `${styles.trigger} ${styles.triggerActive}` : styles.trigger}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-controls={isOpen ? popoverId : undefined}
        onClick={() => (isOpen ? setIsOpen(false) : openPopover())}
      >
        <FilterIcon />
      </button>

      {isOpen && (
        <div id={popoverId} className={styles.popover} role="dialog" aria-label={ariaLabel}>
          <div className={styles.optionList}>
            <label className={styles.option}>
              <input
                ref={selectAllRef}
                type="checkbox"
                checked={selectAllChecked}
                onChange={toggleSelectAll}
              />
              <span>Select All</span>
            </label>
            {options.map((option) => (
              <label key={option} className={styles.option}>
                <input
                  type="checkbox"
                  checked={draftValues.includes(option)}
                  onChange={() => toggleValue(option)}
                />
                <span>{getOptionLabel(option)}</span>
              </label>
            ))}
          </div>
          <div className={styles.actions}>
            <Button className={styles.actionButton} onClick={handleApply}>
              OK
            </Button>
            <Button className={styles.actionButton} onClick={handleCancel}>
              Cancel
            </Button>
            <Button className={styles.actionButton} onClick={handleClear}>
              clear
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
