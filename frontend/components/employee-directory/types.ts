export const EMPLOYEE_ROW_HEIGHT_PX = 52;
export const SEARCH_DEBOUNCE_MS = 300;

export type DirectoryFilters = {
  search: string;
  country: string;
  department: string;
  jobTitle: string;
};

export const emptyDirectoryFilters: DirectoryFilters = {
  search: "",
  country: "",
  department: "",
  jobTitle: "",
};
