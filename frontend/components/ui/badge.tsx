import styles from "./badge.module.css";

type BadgeProps = {
  label: string;
};

export function Badge({ label }: BadgeProps) {
  return <span className={styles.badge}>{label}</span>;
}
