import styles from "./import-steps.module.css";

export type ImportFlowStep = "upload" | "preview" | "complete";

const STEPS: { id: ImportFlowStep; label: string; number: number }[] = [
  { id: "upload", label: "Upload spreadsheet", number: 1 },
  { id: "preview", label: "Validate & preview", number: 2 },
  { id: "complete", label: "Import complete", number: 3 },
];

type ImportStepsProps = {
  currentStep: ImportFlowStep;
};

function stepClassName(stepId: ImportFlowStep, currentStep: ImportFlowStep): string {
  const currentIndex = STEPS.findIndex((step) => step.id === currentStep);
  const stepIndex = STEPS.findIndex((step) => step.id === stepId);

  if (stepIndex < currentIndex) {
    return `${styles.step} ${styles.stepComplete}`;
  }

  if (stepId === currentStep) {
    return `${styles.step} ${styles.stepActive}`;
  }

  return styles.step;
}

export function ImportSteps({ currentStep }: ImportStepsProps) {
  return (
    <ol className={styles.steps} aria-label="Import progress">
      {STEPS.map((step) => (
        <li
          key={step.id}
          className={stepClassName(step.id, currentStep)}
          aria-current={step.id === currentStep ? "step" : undefined}
        >
          <span className={styles.stepNumber} aria-hidden="true">
            {step.number}
          </span>
          <span className={styles.stepLabel}>{step.label}</span>
        </li>
      ))}
    </ol>
  );
}
