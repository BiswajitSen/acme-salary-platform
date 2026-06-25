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
import { Select } from "@/components/ui/select";
import { createEmployee, updateEmployee } from "@/lib/api/employees";
import { countryLabel } from "@/lib/country-label";
import { getRequestErrorMessage } from "@/lib/errors";
import { collectFieldErrorsFromValidationIssues } from "@/lib/forms/zod-field-errors";
import { useEmployeeFieldOptions } from "@/lib/hooks/use-employee-field-options";

import styles from "./employee-form.module.css";

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
  const { departments, jobTitles, countries, isLoading } = useEmployeeFieldOptions({
    department: formState.department,
    jobTitle: formState.jobTitle,
    country: formState.country,
  });

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
          <Select
            id="employee-department"
            label="Department"
            value={formState.department}
            onChange={(event) => updateField("department", event.target.value)}
            error={fieldErrors.department}
            required
            disabled={isLoading}
          >
            <option value="">Select department</option>
            {departments.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </Select>
          <Select
            id="employee-job-title"
            label="Job title"
            value={formState.jobTitle}
            onChange={(event) => updateField("jobTitle", event.target.value)}
            error={fieldErrors.jobTitle}
            required
            disabled={isLoading}
          >
            <option value="">Select job title</option>
            {jobTitles.map((jobTitle) => (
              <option key={jobTitle} value={jobTitle}>
                {jobTitle}
              </option>
            ))}
          </Select>
          <Select
            id="employee-country"
            label="Country"
            value={formState.country}
            onChange={(event) => updateField("country", event.target.value)}
            error={fieldErrors.country}
            required
            disabled={isLoading}
          >
            <option value="">Select country</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {countryLabel(country)}
              </option>
            ))}
          </Select>
        </div>

        {submitError && <Alert variant="error">{submitError}</Alert>}

        <div className={styles.actions}>
          {onCancel && (
            <Button type="button" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          )}
          <Button type="submit" variant="primary" disabled={isSubmitting || isLoading}>
            {isSubmitting ? "Saving…" : submitLabel}
          </Button>
        </div>
      </form>
    </Card>
  );
}
