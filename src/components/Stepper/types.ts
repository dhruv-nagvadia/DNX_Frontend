export interface StepperStep {
  id: string;
  label: string;
  /** Optional small line under the label, e.g. "Optional". */
  hint?: string;
}

export interface StepperProps {
  steps: StepperStep[];
  /** Index of the step being shown. */
  current: number;
  /** The furthest step the user may jump to (everything up to it is clickable). */
  reachable?: number;
  onSelect?: (index: number) => void;
  className?: string;
}
