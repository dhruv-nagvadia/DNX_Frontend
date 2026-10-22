import { Check } from 'lucide-react';

import { OptionSectionProps } from './types';
import styles from './OptionSection.module.css';

/**
 * A checkbox that, when ticked, opens its own mini-section underneath with the
 * settings that belong to it (e.g. "Accept partial payment" → the deposit %).
 * Replaces on/off switches wherever turning something on needs more detail.
 */
export function OptionSection({
  name,
  label,
  description,
  icon,
  checked,
  onChange,
  settingsTitle,
  disabled,
  children,
}: OptionSectionProps) {
  return (
    <div className={`${styles.option} ${checked ? styles.on : ''} ${disabled ? styles.disabled : ''}`}>
      <label className={styles.toggle} htmlFor={name}>
        <span className={styles.control}>
          <input
            id={name}
            name={name}
            type="checkbox"
            className={styles.input}
            checked={checked}
            disabled={disabled}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span className={styles.box} aria-hidden="true">
            <Check size={14} strokeWidth={3} className={styles.tick} />
          </span>
        </span>
        <span className={styles.text}>
          <span className={styles.label}>{label}</span>
          {description && <span className={styles.description}>{description}</span>}
        </span>
        {icon && (
          <span className={styles.icon} aria-hidden="true">
            {icon}
          </span>
        )}
      </label>

      {children && (
        // The settings stay mounted so opening/closing can animate; while closed
        // they're hidden from the tab order and from screen readers.
        <div className={`${styles.reveal} ${checked ? styles.open : ''}`} aria-hidden={!checked}>
          <div className={styles.revealInner}>
            <div className={styles.panel}>
              {settingsTitle && <p className={styles.panelTitle}>{settingsTitle}</p>}
              <div className={styles.panelBody}>{children}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
