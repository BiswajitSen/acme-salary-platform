"use client";

import { useCallback, useEffect, useState } from "react";

import type {
  EmployeeCompensationHistoryResponse,
  EmployeeProfileResponse,
} from "@acme/shared";

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
  reloadProfile: () => Promise<void>;
};

async function fetchEmployeeProfileData(employeeId: string): Promise<{
  profile: EmployeeProfileResponse;
  compensationHistory: EmployeeCompensationHistoryResponse;
}> {
  const [profile, compensationHistory] = await Promise.all([
    getEmployeeProfile(employeeId),
    listEmployeeCompensationHistory(employeeId),
  ]);

  return { profile, compensationHistory };
}

export function useEmployeeProfile(employeeId: string): EmployeeProfileState {
  const [profile, setProfile] = useState<EmployeeProfileResponse | null>(null);
  const [compensationHistory, setCompensationHistory] =
    useState<EmployeeCompensationHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const reloadProfile = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setNotFound(false);

    try {
      const nextData = await fetchEmployeeProfileData(employeeId);

      setProfile(nextData.profile);
      setCompensationHistory(nextData.compensationHistory);
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 404) {
        setNotFound(true);
        setProfile(null);
        setCompensationHistory(null);
        return;
      }

      setErrorMessage("Unable to load the employee profile. Is the backend running?");
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    let isCancelled = false;

    async function loadProfile() {
      setIsLoading(true);
      setErrorMessage(null);
      setNotFound(false);

      try {
        const nextData = await fetchEmployeeProfileData(employeeId);

        if (isCancelled) {
          return;
        }

        setProfile(nextData.profile);
        setCompensationHistory(nextData.compensationHistory);
      } catch (error) {
        if (isCancelled) {
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
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      isCancelled = true;
    };
  }, [employeeId]);

  return {
    profile,
    compensationHistory,
    isLoading,
    errorMessage,
    notFound,
    reloadProfile,
  };
}
