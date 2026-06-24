import Link from "next/link";

import { SystemStatus } from "@/components/system-status";
import { ApiRequestError, getHealthStatus } from "@/lib/api/health";

import styles from "./page.module.css";

type PageState =
  | { kind: "ready"; health: Awaited<ReturnType<typeof getHealthStatus>> }
  | { kind: "error"; message: string };

async function loadPageState(): Promise<PageState> {
  try {
    const health = await getHealthStatus();
    return { kind: "ready", health };
  } catch (error) {
    const message =
      error instanceof ApiRequestError
        ? error.message
        : "Unable to reach the backend API";

    return { kind: "error", message };
  }
}

export default async function Home() {
  const state = await loadPageState();

  return (
    <main className={styles.page}>
      <h1>ACME Salary Platform</h1>
      <p className={styles.subtitle}>
        Next.js frontend · Node.js API · SQLite database
      </p>

      <nav className={styles.nav}>
        <Link href="/employees">Open employee directory</Link>
      </nav>

      {state.kind === "ready" ? (
        <SystemStatus health={state.health} />
      ) : (
        <p className={styles.error} role="alert">
          {state.message}. Start the API with <code>npm run dev:backend</code>{" "}
          from the project root.
        </p>
      )}
    </main>
  );
}
