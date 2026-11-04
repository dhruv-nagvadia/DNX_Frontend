import { formatMoney } from '@/utils/money';

import styles from './EarningsPage.module.css';

const R = 62;
const STROKE = 22;
const C = 2 * Math.PI * R;
const SIZE = (R + STROKE / 2) * 2 + 4;

/** Online vs cash share of the period's sales, total in the middle. */
export function PaymentDonut({
  onlineMinor,
  cashMinor,
}: {
  onlineMinor: number;
  cashMinor: number;
}) {
  const total = onlineMinor + cashMinor;
  const onlineLen = total > 0 ? (onlineMinor / total) * C : 0;
  const cashLen = total > 0 ? C - onlineLen : 0;
  const pct = (v: number) => (total > 0 ? Math.round((v / total) * 100) : 0);

  return (
    <div className={styles.donutRow}>
      <div className={styles.donut}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-label={`Online ${pct(onlineMinor)}%, cash ${pct(cashMinor)}%`}
        >
          <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              strokeWidth={STROKE}
              className={styles.donutTrack}
            />
            {cashLen > 0 && (
              <circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R}
                strokeWidth={STROKE}
                className={styles.donutCash}
                strokeDasharray={`${cashLen} ${C}`}
                strokeDashoffset={-onlineLen}
              />
            )}
            {onlineLen > 0 && (
              <circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R}
                strokeWidth={STROKE}
                className={styles.donutOnline}
                strokeDasharray={`${onlineLen} ${C}`}
              />
            )}
          </g>
        </svg>
        <div className={styles.donutCenter}>
          <span className={styles.donutTotal}>{formatMoney(total)}</span>
          <span className={styles.donutCaption}>Total sales</span>
        </div>
      </div>

      <ul className={styles.donutLegend}>
        <li>
          <span className={`${styles.legendDot} ${styles.dotOnline}`} aria-hidden="true" />
          <span>
            <span className={styles.legendName}>Online</span>
            <span className={styles.legendValue}>
              {formatMoney(onlineMinor)} ({pct(onlineMinor)}%)
            </span>
          </span>
        </li>
        <li>
          <span className={`${styles.legendDot} ${styles.dotCash}`} aria-hidden="true" />
          <span>
            <span className={styles.legendName}>Cash</span>
            <span className={styles.legendValue}>
              {formatMoney(cashMinor)} ({pct(cashMinor)}%)
            </span>
          </span>
        </li>
      </ul>
    </div>
  );
}
