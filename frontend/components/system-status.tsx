import type { HealthStatus } from "@acme/shared";

import styles from "./system-status.module.css";

type SystemStatusProps = {
  health: HealthStatus;
};

export function SystemStatus({ health }: SystemStatusProps) {
  return (
    <section className={styles.card} aria-labelledby="system-status-heading">
      <h2 id="system-status-heading">System status</h2>
      <dl className={styles.grid}>
        <dt>API</dt>
        <dd>{health.status}</dd>
        <dt>Database</dt>
        <dd>{health.database}</dd>
        <dt>Employees</dt>
        <dd>{health.employees}</dd>
        <dt>Compensation records</dt>
        <dd>{health.compensationRecords}</dd>
      </dl>
    </section>
  );
}
