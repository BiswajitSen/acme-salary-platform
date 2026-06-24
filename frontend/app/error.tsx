"use client";

import { useEffect } from "react";

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
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <h1>Something went wrong</h1>
      <p style={{ margin: "1rem 0", color: "#b91c1c" }}>{error.message}</p>
      <button type="button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
