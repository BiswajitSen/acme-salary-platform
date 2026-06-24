import { EmployeeProfile } from "@/components/employee-profile/employee-profile";

type EmployeeProfilePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EmployeeProfilePage({ params }: EmployeeProfilePageProps) {
  const { id } = await params;

  return <EmployeeProfile employeeId={id} />;
}
