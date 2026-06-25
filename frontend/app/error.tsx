"use client";

import { useEffect } from "react";

import styles from "./error.module.css";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Something went wrong</h1>
      <p className={styles.message}>{error.message}</p>
      <button type="button" className={styles.button} onClick={reset}>
        Try again
      </button>
    </main>
  );
}
