import type { InputHTMLAttributes } from "react";

import styles from "./input.module.css";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({ label, id, className, error, ...props }: InputProps) {
  const inputClassName = [styles.input, className].filter(Boolean).join(" ");

  if (!label) {
    return (
      <>
        <input id={id} className={inputClassName} {...props} />
        {error && <span className={styles.error}>{error}</span>}
      </>
    );
  }

  return (
    <label className={styles.field} htmlFor={id}>
      <span className={styles.label}>{label}</span>
      <input id={id} className={inputClassName} {...props} />
      {error && <span className={styles.error}>{error}</span>}
    </label>
  );
}
