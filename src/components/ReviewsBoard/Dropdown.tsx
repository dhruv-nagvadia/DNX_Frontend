import { ReactNode, useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

import styles from './ReviewsBoard.module.css';

interface Option {
  value: string;
  label: string;
}

/** White rounded button that opens a small option list (business picker, sort). */
export function Dropdown({
  icon,
  label,
  ariaLabel,
  value,
  options,
  onChange,
  compact,
}: {
  icon?: ReactNode;
  label: string;
  ariaLabel: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className={styles.dropWrap} ref={ref}>
      <button
        type="button"
        className={`${styles.dropBtn} ${compact ? styles.dropBtnCompact : ''}`}
        aria-label={`${ariaLabel}: ${label}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {icon}
        <span className={styles.dropLabel}>{label}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && (
        <div className={styles.dropMenu} role="listbox" aria-label={ariaLabel}>
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              role="option"
              aria-selected={o.value === value}
              className={`${styles.dropItem} ${o.value === value ? styles.dropItemActive : ''}`}
              onClick={() => {
                setOpen(false);
                onChange(o.value);
              }}
            >
              <span>{o.label}</span>
              {o.value === value && <Check size={15} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
