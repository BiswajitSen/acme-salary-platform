"use client";

import {
  EMPLOYEE_JOB_TITLES,
  INSIGHT_QUERY_COUNTRIES,
  INSIGHT_QUERY_DEPARTMENTS,
  type EmployeeFilterOptions,
} from "@acme/shared";
import { useEffect, useState } from "react";

import { mergeEmployeeFieldOptions } from "@/lib/employee-field-options";
import { listEmployeeFilterOptions } from "@/lib/api/employees";

type EmployeeFieldOptionSets = {
  departments: string[];
  jobTitles: string[];
  countries: string[];
  isLoading: boolean;
};

const EMPTY_FILTER_OPTIONS: EmployeeFilterOptions = {
  countries: [],
  departments: [],
  jobTitles: [],
};

export function useEmployeeFieldOptions(currentValues?: {
  department?: string;
  jobTitle?: string;
  country?: string;
}): EmployeeFieldOptionSets {
  const [directoryOptions, setDirectoryOptions] =
    useState<EmployeeFilterOptions>(EMPTY_FILTER_OPTIONS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    void listEmployeeFilterOptions()
      .then((options) => {
        if (!isCancelled) {
          setDirectoryOptions(options);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  return {
    departments: mergeEmployeeFieldOptions(
      INSIGHT_QUERY_DEPARTMENTS,
      directoryOptions.departments,
      currentValues?.department,
    ),
    jobTitles: mergeEmployeeFieldOptions(
      EMPLOYEE_JOB_TITLES,
      directoryOptions.jobTitles,
      currentValues?.jobTitle,
    ),
    countries: mergeEmployeeFieldOptions(
      INSIGHT_QUERY_COUNTRIES,
      directoryOptions.countries,
      currentValues?.country,
    ),
    isLoading,
  };
}
