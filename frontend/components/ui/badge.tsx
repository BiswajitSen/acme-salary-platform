import styles from "./badge.module.css";

type BadgeVariant = "default" | "department" | "statusActive" | "statusInactive";

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
};

const variantClassName: Record<BadgeVariant, string> = {
  default: styles.badge,
  department: `${styles.badge} ${styles.department}`,
  statusActive: `${styles.badge} ${styles.statusActive}`,
  statusInactive: `${styles.badge} ${styles.statusInactive}`,
};

export function Badge({ label, variant = "default" }: BadgeProps) {
  return <span className={variantClassName[variant]}>{label}</span>;
}
