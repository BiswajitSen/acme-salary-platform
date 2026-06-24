import Link from "next/link";

import styles from "./site-header.module.css";

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandName}>ACME Salary</span>
          <span className={styles.brandTagline}>HR Platform</span>
        </Link>
        <nav className={styles.nav} aria-label="Primary">
          <Link href="/" className={styles.navLink}>
            Directory
          </Link>
          <Link href="/import" className={styles.navLink}>
            Import
          </Link>
        </nav>
      </div>
    </header>
  );
}
