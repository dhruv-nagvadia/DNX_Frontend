import { Check } from 'lucide-react';

import styles from './BusinessFormPage.module.css';

interface FormStepperProps {
  labels: string[];
  current: number;
  /** Furthest step that may be jumped to. */
  reachable: number;
  /** Every step checked (the "done" screen). */
  allDone?: boolean;
  onSelect: (index: number) => void;
}

/** Numbered circles joined by a line: done = blue check, current = filled blue, upcoming = grey outline. */
export function FormStepper({ labels, current, reachable, allDone, onSelect }: FormStepperProps) {
  return (
    <ol className={styles.stepper}>
      {labels.map((label, i) => {
        const done = allDone || i < current;
        const isCurrent = !allDone && i === current;
        const clickable = !allDone && !isCurrent && i <= reachable;
        const state = done ? styles.stepDone : isCurrent ? styles.stepCurrent : styles.stepUpcoming;
        return (
          <li key={label} className={`${styles.stepItem} ${state}`}>
            {i > 0 && <span className={styles.stepLine} aria-hidden="true" />}
            <button
              type="button"
              className={styles.stepBtn}
              onClick={() => onSelect(i)}
              disabled={!clickable}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span className={styles.stepCircle}>
                {done ? <Check size={16} strokeWidth={3} aria-hidden="true" /> : i + 1}
              </span>
              <span className={styles.stepLabel}>{label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
