"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { EmployeeForm } from "@/components/employee-form/employee-form";
import { PageHeader } from "@/components/ui/page-header";

import styles from "./new-employee-page.module.css";

export function NewEmployeePage() {
  const router = useRouter();

  return (
    <section className={styles.page}>
      <PageHeader
        title="Add employee"
        subtitle="Create a new employee record before importing or recording compensation."
        actions={
          <Link href="/" className={styles.backLink}>
            Back to directory
          </Link>
        }
      />

      <EmployeeForm
        mode="create"
        title="Employee details"
        submitLabel="Create employee"
        onSuccess={(profile) => {
          router.push(`/employees/${profile.id}`);
        }}
      />
    </section>
  );
}
