"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "./site-header.module.css";

const NAV_ITEMS = [
  { href: "/", label: "Directory" },
  { href: "/import", label: "Import Employees" },
  { href: "/import/compensation", label: "Import Compensation" },
  { href: "/analytics", label: "Analytics" },
  { href: "/insights", label: "Insights" },
] as const;

function isNavActive(href: string, pathname: string): boolean {
  if (href === "/") {
    return pathname === "/" || pathname.startsWith("/employees");
  }

  // `/import/compensation` must not also highlight `/import`.
  if (href === "/import") {
    return pathname === "/import";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Primary">
      {NAV_ITEMS.map(({ href, label }) => {
        const active = isNavActive(href, pathname);

        return (
          <Link
            key={href}
            href={href}
            className={active ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink}
            aria-current={active ? "page" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
