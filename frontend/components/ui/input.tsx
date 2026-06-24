import type { InputHTMLAttributes } from "react";

import styles from "./input.module.css";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function Input({ label, id, className, ...props }: InputProps) {
  const inputClassName = [styles.input, className].filter(Boolean).join(" ");

  if (!label) {
    return <input id={id} className={inputClassName} {...props} />;
  }

  return (
    <label className={styles.field} htmlFor={id}>
      <span className={styles.label}>{label}</span>
      <input id={id} className={inputClassName} {...props} />
    </label>
  );
}
