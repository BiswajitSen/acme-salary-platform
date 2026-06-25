"use client";

import Link from "next/link";

import { CompensationTimeline } from "@/components/employee-profile/compensation-timeline";
import { EmployeeCurrentCompensation } from "@/components/employee-profile/employee-current-compensation";
import { EmployeeProfileSummary } from "@/components/employee-profile/employee-profile-summary";
import { RecordCompensationChangeForm } from "@/components/employee-profile/record-compensation-change-form";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { StatusMessage } from "@/components/ui/status-message";
import { useDisplayCurrency } from "@/lib/hooks/use-display-currency";
import { useEmployeeProfile } from "@/lib/hooks/use-employee-profile";
import { useExchangeRates } from "@/lib/hooks/use-exchange-rates";

import styles from "./employee-profile.module.css";

type EmployeeProfileProps = {
  employeeId: string;
};

export function EmployeeProfile({ employeeId }: EmployeeProfileProps) {
  const { currency: displayCurrency } = useDisplayCurrency();
  const { ratesToUsd, exchangeRatesAsOf, isLoading: isLoadingRates } = useExchangeRates();
  const { profile, compensationHistory, isLoading, errorMessage, notFound, reloadProfile } =
    useEmployeeProfile(employeeId);

  const canShowProfile = !isLoading && profile !== null && !isLoadingRates;

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
          <EmployeeProfileSummary profile={profile} />
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
