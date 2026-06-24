import type { ReactNode } from "react";

import { SiteHeader } from "./site-header";

import styles from "./app-shell.module.css";

type AppShellProps = {
  children: ReactNode;
  wide?: boolean;
};

export function AppShell({ children, wide = false }: AppShellProps) {
  return (
    <div className={styles.shell}>
      <SiteHeader />
      <main className={wide ? styles.mainWide : styles.main}>{children}</main>
    </div>
  );
}
