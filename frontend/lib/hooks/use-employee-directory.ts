"use client";

import type { EmployeeFilterOptions, PaginatedEmployeesResponse } from "@acme/shared";
import { useEffect, useState } from "react";

import {
  listEmployeeFilterOptions,
  listEmployees,
} from "@/lib/api/employees";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";

import {
  emptyDirectoryFilters,
  SEARCH_DEBOUNCE_MS,
  type DirectoryFilters,
} from "@/components/employee-directory/types";

type EmployeeDirectoryState = {
  filters: DirectoryFilters;
  filterOptions: EmployeeFilterOptions;
  directory: PaginatedEmployeesResponse;
  page: number;
  isLoading: boolean;
  errorMessage: string | null;
  updateFilter: <Key extends keyof DirectoryFilters>(
    key: Key,
    value: DirectoryFilters[Key],
  ) => void;
  goToPreviousPage: () => void;
  goToNextPage: () => void;
};

export function useEmployeeDirectory(): EmployeeDirectoryState {
  const [filters, setFilters] = useState<DirectoryFilters>(emptyDirectoryFilters);
  const [page, setPage] = useState(1);
  const [filterOptions, setFilterOptions] = useState<EmployeeFilterOptions>({
    countries: [],
    departments: [],
    jobTitles: [],
  });
  const [directory, setDirectory] = useState<PaginatedEmployeesResponse>({
    data: [],
    meta: { page: 1, limit: 50, total: 0, totalPages: 0 },
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const debouncedSearch = useDebouncedValue(filters.search, SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    let isActive = true;

    void listEmployeeFilterOptions()
      .then((options) => {
        if (isActive) {
          setFilterOptions(options);
        }
      })
      .catch(() => {
        if (isActive) {
          setErrorMessage("Unable to load filter options.");
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    void (async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await listEmployees({
          page,
          search: debouncedSearch || undefined,
          country: filters.country || undefined,
          department: filters.department || undefined,
          jobTitle: filters.jobTitle || undefined,
        });

        if (isActive) {
          setDirectory(response);
        }
      } catch {
        if (isActive) {
          setErrorMessage("Unable to load employees. Is the backend running?");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [
    debouncedSearch,
    filters.country,
    filters.department,
    filters.jobTitle,
    page,
  ]);

  function updateFilter<Key extends keyof DirectoryFilters>(
    key: Key,
    value: DirectoryFilters[Key],
  ) {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function goToPreviousPage() {
    setPage((current) => current - 1);
  }

  function goToNextPage() {
    setPage((current) => current + 1);
  }

  return {
    filters,
    filterOptions,
    directory,
    page,
    isLoading,
    errorMessage,
    updateFilter,
    goToPreviousPage,
    goToNextPage,
  };
}
