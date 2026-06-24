export function formatFixtureEmployeeId(employeeNumber: number): string {
  return `E${String(employeeNumber).padStart(5, "0")}`;
}

export function parseFixtureEmployeeNumber(employeeId: string): number {
  return Number(employeeId.slice(1));
}
