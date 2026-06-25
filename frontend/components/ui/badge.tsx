import styles from "./badge.module.css";

type BadgeVariant = "default" | "department" | "statusActive" | "statusInactive";

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
};

const variantClassName: Record<BadgeVariant, string> = {
  default: styles.badge,
  department: `${styles.badge} ${styles.department}`,
  statusActive: `${styles.badge} ${styles.status}`,
  statusInactive: `${styles.badge} ${styles.status}`,
};

const statusToneClassName = {
  statusActive: styles.statusActive,
  statusInactive: styles.statusInactive,
} as const;

export function Badge({ label, variant = "default" }: BadgeProps) {
  if (variant === "statusActive" || variant === "statusInactive") {
    return (
      <span className={`${variantClassName[variant]} ${statusToneClassName[variant]}`}>
        <span className={styles.statusDot} aria-hidden="true" />
        <span className={styles.statusLabel}>{label}</span>
      </span>
    );
  }

  return <span className={variantClassName[variant]}>{label}</span>;
}
