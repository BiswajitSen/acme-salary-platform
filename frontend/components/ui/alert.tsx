import type { ReactNode } from "react";

import styles from "./alert.module.css";

type AlertVariant = "error" | "info";

type AlertProps = {
  variant?: AlertVariant;
  children: ReactNode;
};

export function Alert({ variant = "error", children }: AlertProps) {
  return (
    <p className={`${styles.alert} ${styles[variant]}`} role="alert">
      {children}
    </p>
  );
}
