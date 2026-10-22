import { Check } from 'lucide-react';

import { StepperProps } from './types';
import styles from './Stepper.module.css';

/**
 * Numbered progress for a multi-step flow. Finished steps show a tick, the
 * current one is highlighted, and any step up to `reachable` can be clicked to
 * jump back. On narrow screens only the current step keeps its label.
 */
export function Stepper({ steps, current, reachable = current, onSelect, className }: StepperProps) {
  return (
    <nav aria-label="Progress" className={className}>
      <ol className={styles.list}>
        {steps.map((step, i) => {
          const done = i < current;
          const active = i === current;
          const clickable = !!onSelect && i <= reachable && !active;
          return (
            <li
              key={step.id}
              className={`${styles.item} ${done ? styles.done : ''} ${active ? styles.active : ''}`}
            >
              <button
                type="button"
                className={styles.button}
                onClick={() => clickable && onSelect?.(i)}
                disabled={!clickable && !active}
                aria-current={active ? 'step' : undefined}
                aria-label={`Step ${i + 1} of ${steps.length}: ${step.label}`}
                tabIndex={clickable || active ? 0 : -1}
              >
                <span className={styles.circle}>
                  {done ? <Check size={16} strokeWidth={3} aria-hidden="true" /> : i + 1}
                </span>
                <span className={styles.text}>
                  <span className={styles.label}>{step.label}</span>
                  {step.hint && <span className={styles.hint}>{step.hint}</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
