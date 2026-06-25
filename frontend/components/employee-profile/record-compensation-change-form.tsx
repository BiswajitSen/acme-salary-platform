"use client";

import { ANALYTICS_DISPLAY_CURRENCIES, COMPENSATION_REASONS, recordCompensationChangeSchema } from "@acme/shared";
import { useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { recordCompensationChange } from "@/lib/api/employees";

import styles from "./record-compensation-change-form.module.css";

type RecordCompensationChangeFormProps = {
  employeeId: string;
  onRecorded: () => void;
};

type FormState = {
  baseSalary: string;
  currency: string;
  effectiveDate: string;
  reason: string;
  changedBy: string;
  notes: string;
};

const emptyFormState: FormState = {
  baseSalary: "",
  currency: "",
  effectiveDate: "",
  reason: COMPENSATION_REASONS[0],
  changedBy: "",
  notes: "",
};

function collectFieldErrorsFromValidationIssues(
  issues: { path: (string | number)[]; message: string }[],
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  for (const issue of issues) {
    const fieldName = issue.path[0];

    if (typeof fieldName === "string" && !fieldErrors[fieldName]) {
      fieldErrors[fieldName] = issue.message;
    }
  }

  return fieldErrors;
}

export function RecordCompensationChangeForm({
  employeeId,
  onRecorded,
}: RecordCompensationChangeFormProps) {
  const [formState, setFormState] = useState<FormState>(emptyFormState);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof FormState>(fieldName: K, value: FormState[K]) {
    setFormState((currentState) => ({ ...currentState, [fieldName]: value }));
    setFieldErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[fieldName];
      return nextErrors;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    const validationResult = recordCompensationChangeSchema.safeParse({
      baseSalary: Number(formState.baseSalary),
      currency: formState.currency,
      effectiveDate: formState.effectiveDate,
      reason: formState.reason,
      changedBy: formState.changedBy,
      notes: formState.notes || undefined,
    });

    if (!validationResult.success) {
      setFieldErrors(
        collectFieldErrorsFromValidationIssues(validationResult.error.issues),
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await recordCompensationChange(employeeId, validationResult.data);
      setFormState(emptyFormState);
      setFieldErrors({});
      onRecorded();
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Unable to record the compensation change.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card title="Record compensation change">
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.grid}>
          <Input
            id="compensation-base-salary"
            label="Base salary"
            type="number"
            min="0"
            step="0.01"
            value={formState.baseSalary}
            onChange={(event) => updateField("baseSalary", event.target.value)}
            error={fieldErrors.baseSalary}
          />
          <Select
            id="compensation-currency"
            label="Currency"
            value={formState.currency}
            onChange={(event) => updateField("currency", event.target.value)}
          >
            <option value="">Select currency</option>
            {ANALYTICS_DISPLAY_CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </Select>
          <Input
            id="compensation-effective-date"
            label="Effective date"
            type="date"
            value={formState.effectiveDate}
            onChange={(event) => updateField("effectiveDate", event.target.value)}
            error={fieldErrors.effectiveDate}
          />
          <Select
            id="compensation-reason"
            label="Reason"
            value={formState.reason}
            onChange={(event) => updateField("reason", event.target.value)}
          >
            {COMPENSATION_REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </Select>
          <Input
            id="compensation-changed-by"
            label="Changed by"
            value={formState.changedBy}
            onChange={(event) => updateField("changedBy", event.target.value)}
            error={fieldErrors.changedBy}
          />
          <Input
            id="compensation-notes"
            label="Notes"
            value={formState.notes}
            onChange={(event) => updateField("notes", event.target.value)}
            error={fieldErrors.notes}
          />
        </div>

        {fieldErrors.currency && <p className={styles.fieldError}>{fieldErrors.currency}</p>}
        {fieldErrors.reason && <p className={styles.fieldError}>{fieldErrors.reason}</p>}
        {submitError && <Alert variant="error">{submitError}</Alert>}

        <div className={styles.actions}>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Recording…" : "Record change"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
