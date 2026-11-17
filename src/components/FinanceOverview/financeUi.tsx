import { ReactNode } from 'react';

import styles from '@/components/FinanceTable/FinanceTable.module.css';

/* Purely visual building blocks shared by the admin money screens. */

export type TileTone = 'blue' | 'lavender' | 'peach' | 'mint' | 'pink';

const TILE_TONE: Record<TileTone, string> = {
  blue: styles.tileBlue,
  lavender: styles.tileLavender,
  peach: styles.tilePeach,
  mint: styles.tileMint,
  pink: styles.tilePink,
};

/** Pastel money tile (same look as the provider Earnings page). */
export function MoneyTile({
  tone,
  icon,
  label,
  value,
  note,
}: {
  tone: TileTone;
  icon: ReactNode;
  label: string;
  value: ReactNode;
  note?: ReactNode;
}) {
  return (
    <div className={`${styles.tile} ${TILE_TONE[tone]}`}>
      <span className={styles.tileIcon} aria-hidden="true">
        {icon}
      </span>
      <span className={styles.tileText}>
        <span className={styles.tileLabel}>{label}</span>
        <span className={styles.tileValue}>{value}</span>
        {note && <span className={styles.tileNote}>{note}</span>}
      </span>
    </div>
  );
}

/** Compact segmented switch (range presets, day/month). */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className={styles.segmented} role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={o.id === value}
          className={`${styles.segment} ${o.id === value ? styles.segmentActive : ''}`}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const AVATAR_TONES = ['blue', 'lavender', 'green', 'orange', 'teal'] as const;

function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}

/** Coloured initials + name/subline, with a stable colour per id. */
export function EntityCell({ id, name, sub }: { id: string; name: string; sub?: ReactNode }) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const tone = AVATAR_TONES[hash % AVATAR_TONES.length];
  return (
    <span className={styles.entity}>
      <span className={`${styles.avatar} ${styles[`avatar_${tone}`]}`} aria-hidden="true">
        {initialsOf(name)}
      </span>
      <span className={styles.cellMain}>
        <span className={styles.cellTitle}>{name}</span>
        {sub && <span className={styles.muted}>{sub}</span>}
      </span>
    </span>
  );
}
