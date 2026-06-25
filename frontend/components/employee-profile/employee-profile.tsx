"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { CompensationTimeline } from "@/components/employee-profile/compensation-timeline";
import { EmployeeCurrentCompensation } from "@/components/employee-profile/employee-current-compensation";
import { EmployeeProfileSummary } from "@/components/employee-profile/employee-profile-summary";
import { RecordCompensationChangeForm } from "@/components/employee-profile/record-compensation-change-form";
import { EmployeeForm } from "@/components/employee-form/employee-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusMessage } from "@/components/ui/status-message";
import { deleteEmployee } from "@/lib/api/employees";
import { useDisplayCurrency } from "@/lib/hooks/use-display-currency";
import { useEmployeeProfile } from "@/lib/hooks/use-employee-profile";
import { useExchangeRates } from "@/lib/hooks/use-exchange-rates";

import styles from "./employee-profile.module.css";

type EmployeeProfileProps = {
  employeeId: string;
};

export function EmployeeProfile({ employeeId }: EmployeeProfileProps) {
  const router = useRouter();
  const { currency: displayCurrency } = useDisplayCurrency();
  const { ratesToUsd, exchangeRatesAsOf, isLoading: isLoadingRates } = useExchangeRates();
  const { profile, compensationHistory, isLoading, errorMessage, notFound, reloadProfile } =
    useEmployeeProfile(employeeId);
  const [isEditing, setIsEditing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canShowProfile = !isLoading && profile !== null && !isLoadingRates;

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete employee ${employeeId}? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setActionError(null);
    setIsDeleting(true);

    try {
      await deleteEmployee(employeeId);
      router.push("/");
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to delete the employee.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className={styles.page}>
      <PageHeader
        title={profile?.fullName ?? "Employee profile"}
        subtitle={profile ? `${profile.id} · ${profile.jobTitle}` : employeeId}
        actions={
          <div className={styles.headerActions}>
            {profile && !isEditing && (
              <>
                <Button type="button" onClick={() => setIsEditing(true)}>
                  Edit employee
                </Button>
                <Button type="button" onClick={() => void handleDelete()} disabled={isDeleting}>
                  {isDeleting ? "Deleting…" : "Delete employee"}
                </Button>
              </>
            )}
            <Link href="/" className={styles.backLink}>
              Back to directory
            </Link>
          </div>
        }
      />

      {isLoading && <StatusMessage isLoading message="Loading employee profile…" />}

      {notFound && (
        <Alert variant="error">Employee {employeeId} was not found.</Alert>
      )}

      {errorMessage && <Alert variant="error">{errorMessage}</Alert>}
      {actionError && <Alert variant="error">{actionError}</Alert>}

      {!isLoading && profile && isLoadingRates && (
        <StatusMessage isLoading message="Loading exchange rates…" />
      )}

      {canShowProfile && ratesToUsd === null && (
        <Alert variant="error">
          Exchange rates are unavailable. Salaries are shown in their recorded currency.
        </Alert>
      )}

      {canShowProfile && (
        <>
          {ratesToUsd !== null && (
            <p className={styles.fxNote}>
              Salaries shown in {displayCurrency}. FX rates as of {exchangeRatesAsOf}.
            </p>
          )}
          {isEditing ? (
            <EmployeeForm
              mode="edit"
              employeeId={employeeId}
              title="Edit employee"
              submitLabel="Save changes"
              initialValues={{
                id: profile.id,
                fullName: profile.fullName,
                department: profile.department,
                jobTitle: profile.jobTitle,
                country: profile.country,
              }}
              onCancel={() => setIsEditing(false)}
              onSuccess={() => {
                setIsEditing(false);
                void reloadProfile();
              }}
            />
          ) : (
            <EmployeeProfileSummary profile={profile} />
          )}
          <RecordCompensationChangeForm
            employeeId={employeeId}
            onRecorded={() => {
              void reloadProfile();
            }}
          />
          <EmployeeCurrentCompensation
            currentCompensation={profile.currentCompensation}
            displayCurrency={displayCurrency}
            ratesToUsd={ratesToUsd}
          />
          <CompensationTimeline
            entries={compensationHistory?.entries ?? []}
            displayCurrency={displayCurrency}
            ratesToUsd={ratesToUsd}
          />
        </>
      )}
    </section>
  );
}
