import styles from "./status-message.module.css";

type StatusMessageProps = {
  isLoading?: boolean;
  message: string;
};

export function StatusMessage({ isLoading = false, message }: StatusMessageProps) {
  if (isLoading) {
    return (
      <p className={`${styles.message} ${styles.loading}`} aria-live="polite">
        <span className={styles.spinner} aria-hidden="true" />
        {message}
      </p>
    );
  }

  return (
    <p className={styles.message} aria-live="polite">
      {message}
    </p>
  );
}
