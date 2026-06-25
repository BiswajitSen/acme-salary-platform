import { employeeInitials } from "@/lib/employee-initials";

import styles from "./employee-avatar.module.css";

type EmployeeAvatarProps = {
  fullName: string;
};

export function EmployeeAvatar({ fullName }: EmployeeAvatarProps) {
  return (
    <span className={styles.avatar} aria-hidden="true">
      {employeeInitials(fullName)}
    </span>
  );
}
