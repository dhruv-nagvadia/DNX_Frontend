import { ToggleSwitchProps } from './types';
import styles from './ToggleSwitch.module.css';

/** An on/off switch — a real, focusable checkbox styled as a sliding toggle. */
export function ToggleSwitch({ label, checked, onChange, name, id, disabled }: ToggleSwitchProps) {
  const inputId = id ?? name;

  return (
    <label className={styles.row} htmlFor={inputId}>
      <span className={styles.label}>{label}</span>
      <span className={styles.track}>
        <input
          id={inputId}
          name={name}
          type="checkbox"
          className={styles.input}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
        />
        <span className={styles.slider} aria-hidden="true" />
      </span>
    </label>
  );
}
