"use client";

import type {
  EmployeeCompensationHistoryResponse,
  EmployeeProfileResponse,
} from "@acme/shared";
import { useEffect, useState } from "react";

import {
  getEmployeeProfile,
  listEmployeeCompensationHistory,
} from "@/lib/api/employees";
import { ApiRequestError } from "@/lib/api/client";

type EmployeeProfileState = {
  profile: EmployeeProfileResponse | null;
  compensationHistory: EmployeeCompensationHistoryResponse | null;
  isLoading: boolean;
  errorMessage: string | null;
  notFound: boolean;
};

export function useEmployeeProfile(employeeId: string): EmployeeProfileState {
  const [profile, setProfile] = useState<EmployeeProfileResponse | null>(null);
  const [compensationHistory, setCompensationHistory] =
    useState<EmployeeCompensationHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let isActive = true;

    void (async () => {
      setIsLoading(true);
      setErrorMessage(null);
      setNotFound(false);

      try {
        const [nextProfile, nextHistory] = await Promise.all([
          getEmployeeProfile(employeeId),
          listEmployeeCompensationHistory(employeeId),
        ]);

        if (isActive) {
          setProfile(nextProfile);
          setCompensationHistory(nextHistory);
        }
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (error instanceof ApiRequestError && error.status === 404) {
          setNotFound(true);
          setProfile(null);
          setCompensationHistory(null);
          return;
        }

        setErrorMessage("Unable to load the employee profile. Is the backend running?");
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [employeeId]);

  return {
    profile,
    compensationHistory,
    isLoading,
    errorMessage,
    notFound,
  };
}
