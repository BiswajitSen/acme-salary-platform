"use client";

import Link from "next/link";

import { CompensationTimeline } from "@/components/employee-profile/compensation-timeline";
import { EmployeeCurrentCompensation } from "@/components/employee-profile/employee-current-compensation";
import { EmployeeProfileSummary } from "@/components/employee-profile/employee-profile-summary";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { StatusMessage } from "@/components/ui/status-message";
import { useEmployeeProfile } from "@/lib/hooks/use-employee-profile";

import styles from "./employee-profile.module.css";

type EmployeeProfileProps = {
  employeeId: string;
};

export function EmployeeProfile({ employeeId }: EmployeeProfileProps) {
  const { profile, compensationHistory, isLoading, errorMessage, notFound } =
    useEmployeeProfile(employeeId);

  return (
    <section className={styles.page}>
      <PageHeader
        title={profile?.fullName ?? "Employee profile"}
        subtitle={profile ? `${profile.id} · ${profile.jobTitle}` : employeeId}
        actions={
          <Link href="/" className={styles.backLink}>
            Back to directory
          </Link>
        }
      />

      {isLoading && <StatusMessage isLoading message="Loading employee profile…" />}

      {notFound && (
        <Alert variant="error">Employee {employeeId} was not found.</Alert>
      )}

      {errorMessage && <Alert variant="error">{errorMessage}</Alert>}

      {!isLoading && profile && (
        <>
          <EmployeeProfileSummary profile={profile} />
          <EmployeeCurrentCompensation
            currentCompensation={profile.currentCompensation}
          />
          <CompensationTimeline entries={compensationHistory?.entries ?? []} />
        </>
      )}
    </section>
  );
}
