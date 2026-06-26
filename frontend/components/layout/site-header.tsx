"use client";

import Link from "next/link";
import { useState } from "react";

import { DisplayCurrencySelector } from "./display-currency-selector";
import { SiteNav } from "./site-nav";

import styles from "./site-header.module.css";

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.start}>
          <Link href="/" className={styles.brand} onClick={() => setIsMenuOpen(false)}>
            <span className={styles.brandName}>ACME Salary</span>
            <span className={styles.brandTagline}>HR Platform</span>
          </Link>
          <button
            type="button"
            className={styles.menuButton}
            aria-expanded={isMenuOpen}
            aria-controls="site-primary-nav"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {isMenuOpen ? "Close" : "Menu"}
          </button>
        </div>
        <div className={`${styles.end} ${isMenuOpen ? styles.endOpen : ""}`}>
          <SiteNav id="site-primary-nav" onNavigate={() => setIsMenuOpen(false)} />
          <DisplayCurrencySelector />
        </div>
      </div>
    </header>
  );
}
