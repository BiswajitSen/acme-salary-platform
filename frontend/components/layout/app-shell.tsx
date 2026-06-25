"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { DisplayCurrencyProvider } from "@/lib/hooks/display-currency-provider";
import { SiteHeader } from "./site-header";

import styles from "./app-shell.module.css";

type AppShellProps = {
  children: ReactNode;
  wide?: boolean;
};

export function AppShell({ children, wide = false }: AppShellProps) {
  const pathname = usePathname();
  const isWideLayout = wide || pathname.startsWith("/analytics");

  return (
    <DisplayCurrencyProvider>
      <div className={styles.shell}>
        <SiteHeader />
        <main className={isWideLayout ? styles.mainWide : styles.main}>{children}</main>
      </div>
    </DisplayCurrencyProvider>
  );
}
