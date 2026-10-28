import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Clock } from 'lucide-react';

import styles from './TimeField.module.css';

export interface TimeFieldProps {
  id?: string;
  value: string; // "HH:MM", 24-hour
  onChange: (value: string) => void;
  'aria-label'?: string;
  disabled?: boolean;
  className?: string;
}

type Meridiem = 'AM' | 'PM';

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const MERIDIEMS: Meridiem[] = ['AM', 'PM'];
const pad = (n: number) => String(n).padStart(2, '0');

const timeFmt = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' });

/** 24-hour → { hour12 (1-12), minute, meridiem }. */
function to12(hhmm: string): { hour12: number; minute: number; meridiem: Meridiem } {
  const [h24, minute] = hhmm.split(':').map((n) => Number(n) || 0);
  const meridiem: Meridiem = h24 >= 12 ? 'PM' : 'AM';
  const hour12 = h24 % 12 || 12;
  return { hour12, minute, meridiem };
}

/** { hour12 (1-12), minute, meridiem } → 24-hour "HH:MM". */
function to24(hour12: number, minute: number, meridiem: Meridiem): string {
  let h24 = hour12 % 12;
  if (meridiem === 'PM') h24 += 12;
  return `${pad(h24)}:${pad(minute)}`;
}

function formatLabel(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return timeFmt.format(d);
}

/**
 * A themed hour/minute/AM-PM picker — three independent scrollable columns,
 * exactly like setting a native `<input type="time">`'s fields, but with a
 * look (and an accent color) the browser's own popup never let us control.
 * Portaled to `document.body` and positioned from the field's own box, so
 * it's never clipped by an ancestor's `overflow: hidden` (e.g. the shared
 * Card).
 */
export function TimeField({ id, value, onChange, disabled, className, ...rest }: TimeFieldProps) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const hourColRef = useRef<HTMLDivElement>(null);
  const minuteColRef = useRef<HTMLDivElement>(null);

  const { hour12, minute, meridiem } = to12(value);

  useLayoutEffect(() => {
    if (!open) return;
    const updateRect = () => {
      const box = wrapRef.current?.getBoundingClientRect();
      if (box) setRect({ top: box.bottom + 6, left: box.left, width: box.width });
    };
    updateRect();
    window.addEventListener('scroll', updateRect, true);
    window.addEventListener('resize', updateRect);
    return () => {
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (wrapRef.current?.contains(target) || popRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    hourColRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: 'center' });
    minuteColRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: 'center' });
  }, [open]);

  return (
    <div className={`${styles.wrap} ${className ?? ''}`} ref={wrapRef}>
      <button
        type="button"
        id={id}
        className={styles.field}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        {...rest}
      >
        <Clock size={14} className={styles.icon} aria-hidden="true" />
        <span className={styles.value}>{formatLabel(value)}</span>
        <ChevronDown
          size={14}
          className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
          aria-hidden="true"
        />
      </button>

      {open &&
        rect &&
        createPortal(
          <div
            ref={popRef}
            className={styles.dropdown}
            style={{ top: rect.top, left: rect.left, minWidth: Math.max(rect.width, 170) }}
          >
            <div className={styles.columns}>
              <div className={styles.column} ref={hourColRef} role="listbox" aria-label="Hour">
                {HOURS_12.map((hh) => (
                  <button
                    type="button"
                    key={hh}
                    role="option"
                    aria-selected={hh === hour12}
                    data-active={hh === hour12}
                    className={`${styles.option} ${hh === hour12 ? styles.optionActive : ''}`}
                    onClick={() => onChange(to24(hh, minute, meridiem))}
                  >
                    {pad(hh)}
                  </button>
                ))}
              </div>
              <div className={styles.colon}>:</div>
              <div className={styles.column} ref={minuteColRef} role="listbox" aria-label="Minute">
                {MINUTES.map((mm) => (
                  <button
                    type="button"
                    key={mm}
                    role="option"
                    aria-selected={mm === minute}
                    data-active={mm === minute}
                    className={`${styles.option} ${mm === minute ? styles.optionActive : ''}`}
                    onClick={() => onChange(to24(hour12, mm, meridiem))}
                  >
                    {pad(mm)}
                  </button>
                ))}
              </div>
              <div className={styles.meridiemColumn} role="listbox" aria-label="AM or PM">
                {MERIDIEMS.map((mer) => (
                  <button
                    type="button"
                    key={mer}
                    role="option"
                    aria-selected={mer === meridiem}
                    className={`${styles.option} ${mer === meridiem ? styles.optionActive : ''}`}
                    onClick={() => onChange(to24(hour12, minute, mer))}
                  >
                    {mer}
                  </button>
                ))}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
