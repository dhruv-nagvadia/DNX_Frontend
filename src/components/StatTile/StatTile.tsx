import { StatTileProps } from './types';
import styles from './StatTile.module.css';

/** One number with its label. Group several in a row for a stat strip. */
export function StatTile({ label, value, icon, note }: StatTileProps) {
  return (
    <div className={styles.tile}>
      <div className={styles.head}>
        <span className={styles.label}>{label}</span>
        {icon && <span className={styles.icon}>{icon}</span>}
      </div>
      <div className={styles.value}>{value}</div>
      {note && <div className={styles.note}>{note}</div>}
    </div>
  );
}
