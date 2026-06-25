"use client";

import {
  createEmployeeSchema,
  updateEmployeeSchema,
  type EmployeeProfileResponse,
} from "@acme/shared";
import { useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createEmployee, updateEmployee } from "@/lib/api/employees";
import { collectFieldErrorsFromValidationIssues } from "@/lib/forms/zod-field-errors";
import { getRequestErrorMessage } from "@/lib/errors";

type EmployeeFormValues = {
  id: string;
  fullName: string;
  department: string;
  jobTitle: string;
  country: string;
};

type EmployeeFormProps = {
  mode: "create" | "edit";
  employeeId?: string;
  initialValues?: EmployeeFormValues;
  title: string;
  submitLabel: string;
  onSuccess: (profile: EmployeeProfileResponse) => void;
  onCancel?: () => void;
};

const emptyValues: EmployeeFormValues = {
  id: "",
  fullName: "",
  department: "",
  jobTitle: "",
  country: "",
};

import styles from "./employee-form.module.css";

export function EmployeeForm({
  mode,
  employeeId,
  initialValues = emptyValues,
  title,
  submitLabel,
  onSuccess,
  onCancel,
}: EmployeeFormProps) {
  const [formState, setFormState] = useState<EmployeeFormValues>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof EmployeeFormValues>(
    fieldName: K,
    value: EmployeeFormValues[K],
  ) {
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

    if (mode === "create") {
      const validationResult = createEmployeeSchema.safeParse(formState);

      if (!validationResult.success) {
        setFieldErrors(
          collectFieldErrorsFromValidationIssues(validationResult.error.issues),
        );
        return;
      }

      setIsSubmitting(true);

      try {
        const profile = await createEmployee(validationResult.data);
        onSuccess(profile);
      } catch (error) {
        setSubmitError(
          getRequestErrorMessage(error, "Unable to create the employee."),
        );
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    const validationResult = updateEmployeeSchema.safeParse({
      fullName: formState.fullName,
      department: formState.department,
      jobTitle: formState.jobTitle,
      country: formState.country,
    });

    if (!validationResult.success) {
      setFieldErrors(
        collectFieldErrorsFromValidationIssues(validationResult.error.issues),
      );
      return;
    }

    if (!employeeId) {
      setSubmitError("Employee ID is missing.");
      return;
    }

    setIsSubmitting(true);

    try {
      const profile = await updateEmployee(employeeId, validationResult.data);
      onSuccess(profile);
    } catch (error) {
      setSubmitError(getRequestErrorMessage(error, "Unable to update the employee."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card title={title}>
      <form className={styles.form} noValidate onSubmit={handleSubmit}>
        <div className={styles.grid}>
          {mode === "create" ? (
            <Input
              id="employee-id"
              label="Employee ID"
              value={formState.id}
              onChange={(event) => updateField("id", event.target.value)}
              error={fieldErrors.id}
              required
            />
          ) : (
            <div>
              <span className={styles.readOnlyValue}>Employee ID: {employeeId}</span>
            </div>
          )}
          <Input
            id="employee-full-name"
            label="Full name"
            value={formState.fullName}
            onChange={(event) => updateField("fullName", event.target.value)}
            error={fieldErrors.fullName}
            required
          />
          <Input
            id="employee-department"
            label="Department"
            value={formState.department}
            onChange={(event) => updateField("department", event.target.value)}
            error={fieldErrors.department}
            required
          />
          <Input
            id="employee-job-title"
            label="Job title"
            value={formState.jobTitle}
            onChange={(event) => updateField("jobTitle", event.target.value)}
            error={fieldErrors.jobTitle}
            required
          />
          <Input
            id="employee-country"
            label="Country"
            value={formState.country}
            onChange={(event) => updateField("country", event.target.value)}
            error={fieldErrors.country}
            required
            maxLength={3}
          />
        </div>

        {submitError && <Alert variant="error">{submitError}</Alert>}

        <div className={styles.actions}>
          {onCancel && (
            <Button type="button" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          )}
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : submitLabel}
          </Button>
        </div>
      </form>
    </Card>
  );
}
