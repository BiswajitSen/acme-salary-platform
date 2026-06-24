export class EmployeeImportValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: Array<{
      rowNumber: number;
      field: string;
      message: string;
    }>,
  ) {
    super(message);
    this.name = "EmployeeImportValidationError";
  }
}
