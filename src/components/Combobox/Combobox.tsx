import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search } from 'lucide-react';

import styles from './Combobox.module.css';

export interface ComboboxItem<T = unknown> {
  label: string;
  meta?: T;
}

export interface ComboboxProps<T = unknown> {
  id?: string;
  name?: string;
  value: string;
  placeholder?: string;
  /** Full catalog to search — filtered live against the current value. */
  items: ComboboxItem<T>[];
  /** Free typing — same shape as a plain controlled `<input>`. */
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Fired when an item is picked from the dropdown (click or Enter). */
  onSelect: (item: ComboboxItem<T>) => void;
  className?: string;
}

const MAX_RESULTS = 60;

/**
 * A text input that doubles as a searchable dropdown over a (potentially
 * large) suggestion catalog — type to filter, click or arrow+Enter to pick,
 * or just keep typing your own value. Renders as a plain input when `items`
 * is empty, so it's a safe drop-in wherever a name field is needed.
 *
 * The dropdown itself is portaled to `document.body` and positioned from the
 * input's own bounding box — a plain in-place dropdown gets silently clipped
 * whenever this sits inside any container with `overflow: hidden` (e.g. the
 * shared `Card`), which is basically everywhere in this app.
 */
export function Combobox<T = unknown>({
  id,
  name,
  value,
  placeholder,
  items,
  onChange,
  onSelect,
  className,
}: ComboboxProps<T>) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout>>();
  const wrapRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    const q = value.trim().toLowerCase();
    const pool = q ? items.filter((i) => i.label.toLowerCase().includes(q)) : items;
    return pool.slice(0, MAX_RESULTS);
  }, [items, value]);

  const showDropdown = open && items.length > 0;

  // Track the input's position while the dropdown is open, so it stays
  // aligned under the field even if the page scrolls or resizes.
  useLayoutEffect(() => {
    if (!showDropdown) return;

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
  }, [showDropdown]);

  const pick = (item: ComboboxItem<T>) => {
    onSelect(item);
    setOpen(false);
  };

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <div className={styles.inputRow}>
        {items.length > 0 && <Search size={15} className={styles.icon} aria-hidden="true" />}
        <input
          id={id}
          name={name}
          className={`${styles.input} ${items.length > 0 ? styles.withIcon : ''} ${className ?? ''}`}
          placeholder={placeholder}
          value={value}
          autoComplete="off"
          onChange={(e) => {
            onChange(e);
            setHighlight(0);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // Delay so a click on a dropdown item registers before it unmounts.
            blurTimer.current = setTimeout(() => setOpen(false), 120);
          }}
          onKeyDown={(e) => {
            if (!showDropdown || matches.length === 0) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHighlight((h) => Math.min(h + 1, matches.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlight((h) => Math.max(h - 1, 0));
            } else if (e.key === 'Enter' && matches[highlight]) {
              e.preventDefault();
              clearTimeout(blurTimer.current);
              pick(matches[highlight]);
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
        />
      </div>

      {showDropdown &&
        rect &&
        createPortal(
          <div
            className={styles.dropdown}
            role="listbox"
            style={{ top: rect.top, left: rect.left, width: rect.width }}
          >
            {matches.length > 0 ? (
              matches.map((item, i) => (
                <button
                  type="button"
                  key={item.label}
                  role="option"
                  aria-selected={i === highlight}
                  className={`${styles.option} ${i === highlight ? styles.optionActive : ''}`}
                  onMouseDown={(e) => e.preventDefault()} // keep focus so onBlur doesn't beat the click
                  onClick={() => {
                    clearTimeout(blurTimer.current);
                    pick(item);
                  }}
                  onMouseEnter={() => setHighlight(i)}
                >
                  {item.label}
                </button>
              ))
            ) : (
              <p className={styles.empty}>No matches — this will be added as a new, custom item.</p>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
