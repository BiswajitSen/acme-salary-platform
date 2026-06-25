import type { ReactNode, SelectHTMLAttributes } from "react";

import styles from "./select.module.css";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  children: ReactNode;
};

export function Select({
  label,
  id,
  className,
  error,
  children,
  ...props
}: SelectProps) {
  const selectClassName = [styles.select, className].filter(Boolean).join(" ");

  if (!label) {
    return (
      <>
        <select id={id} className={selectClassName} {...props}>
          {children}
        </select>
        {error && <span className={styles.error}>{error}</span>}
      </>
    );
  }

  return (
    <label className={styles.field} htmlFor={id}>
      <span className={styles.label}>{label}</span>
      <select id={id} className={selectClassName} {...props}>
        {children}
      </select>
      {error && <span className={styles.error}>{error}</span>}
    </label>
  );
}
