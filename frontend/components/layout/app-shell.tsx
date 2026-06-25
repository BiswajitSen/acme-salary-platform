"use client";

import type { ReactNode } from "react";

import { DisplayCurrencyProvider } from "@/lib/hooks/display-currency-provider";
import { SiteHeader } from "./site-header";

import styles from "./app-shell.module.css";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <DisplayCurrencyProvider>
      <div className={styles.shell}>
        <SiteHeader />
        <main className={styles.main}>{children}</main>
      </div>
    </DisplayCurrencyProvider>
  );
}
