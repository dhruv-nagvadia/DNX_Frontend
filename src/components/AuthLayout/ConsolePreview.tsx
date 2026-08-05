import { CalendarDays, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';

import styles from './ConsolePreview.module.css';

/**
 * A bento grid that *shows* the provider console instead of describing it.
 *
 * Everything here is illustrative sample UI — it never reads live data — so the
 * whole block is aria-hidden and the real value proposition stays in the text
 * above it. Swap the sample values below for marketing-approved ones.
 */
const APPOINTMENTS = [
  { time: '09:30', initials: 'RS', name: 'Riya S.', service: 'Hair Spa' },
  { time: '11:00', initials: 'AK', name: 'Arjun K.', service: 'Beard Trim' },
  { time: '16:15', initials: 'MP', name: 'Meera P.', service: 'Bridal Makeup' },
];

/** Relative bar heights (%) for the revenue sparkline. */
const REVENUE_BARS = [38, 54, 45, 70, 58, 84, 100];

export function ConsolePreview() {
  return (
    <div className={styles.wrap}>
      {/* Labelled, and outside the aria-hidden block: the numbers below are a
          product illustration, and must never read as a claim about anyone's
          actual business. */}
      <p className={styles.caption}>A preview of your dashboard</p>

      <div className={styles.bento} aria-hidden="true">
        {/* Today's schedule */}
        <article className={`${styles.tile} ${styles.wide}`}>
          <header className={styles.tileHead}>
            <span className={styles.tileLabel}>
              <CalendarDays size={14} />
              Today
            </span>
            <span className={styles.count}>3 bookings</span>
          </header>

          <ul className={styles.list}>
            {APPOINTMENTS.map((a) => (
              <li key={a.time} className={styles.row}>
                <span className={styles.avatar}>{a.initials}</span>
                <span className={styles.rowText}>
                  <span className={styles.rowName}>{a.name}</span>
                  <span className={styles.rowService}>{a.service}</span>
                </span>
                <span className={styles.time}>{a.time}</span>
              </li>
            ))}
          </ul>
        </article>

        {/* Revenue */}
        <article className={styles.tile}>
          <span className={styles.tileLabel}>
            <TrendingUp size={14} />
            This month
          </span>
          <p className={styles.metric}>&#8377;48,200</p>
          <div className={styles.spark}>
            {REVENUE_BARS.map((height, i) => (
              <span
                key={i}
                className={styles.bar}
                style={{ '--bar-h': `${height}%`, '--bar-i': i } as React.CSSProperties}
              />
            ))}
          </div>
        </article>

        {/* AI receptionist */}
        <article className={styles.tile}>
          <span className={styles.tileLabel}>
            <Sparkles size={14} />
            AI receptionist
          </span>
          <div className={styles.switchRow}>
            <span className={styles.switchTrack}>
              <span className={styles.switchKnob} />
            </span>
            <span className={styles.switchState}>On</span>
          </div>
          <p className={styles.tileFoot}>Answering calls while you work</p>
        </article>

        {/* Live activity */}
        <article className={`${styles.tile} ${styles.wide} ${styles.live}`}>
          <span className={styles.pulse} />
          <span className={styles.liveText}>
            <span className={styles.liveTitle}>New booking confirmed</span>
            <span className={styles.liveMeta}>
              Payment received &middot; Added to your calendar
            </span>
          </span>
          <ShieldCheck size={18} className={styles.liveIcon} />
        </article>
      </div>
    </div>
  );
}
