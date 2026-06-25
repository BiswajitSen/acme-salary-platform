import type { ChangeEvent } from "react";

import styles from "./employee-directory-search.module.css";

type EmployeeDirectorySearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export function EmployeeDirectorySearch({ value, onChange }: EmployeeDirectorySearchProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value);
  }

  return (
    <div className={styles.searchBar}>
      <input
        type="search"
        className={styles.searchInput}
        placeholder="Search by name or employee ID"
        value={value}
        onChange={handleChange}
        aria-label="Search employees"
      />
    </div>
  );
}
