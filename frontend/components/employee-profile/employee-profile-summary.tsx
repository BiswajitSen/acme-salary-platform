import type { EmployeeProfileResponse } from "@acme/shared";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

import styles from "./employee-profile-summary.module.css";

type EmployeeProfileSummaryProps = {
  profile: EmployeeProfileResponse;
};

export function EmployeeProfileSummary({ profile }: EmployeeProfileSummaryProps) {
  return (
    <Card title="Employee summary">
      <dl className={styles.grid}>
        <div>
          <dt>Employee ID</dt>
          <dd>{profile.id}</dd>
        </div>
        <div>
          <dt>Full name</dt>
          <dd>{profile.fullName}</dd>
        </div>
        <div>
          <dt>Department</dt>
          <dd>{profile.department}</dd>
        </div>
        <div>
          <dt>Job title</dt>
          <dd>{profile.jobTitle}</dd>
        </div>
        <div>
          <dt>Country</dt>
          <dd>
            <Badge label={profile.country} />
          </dd>
        </div>
      </dl>
    </Card>
  );
}
