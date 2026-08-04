import { Clock } from 'lucide-react';

import { Button } from '@/components/Button';
import { BusinessHoursProps } from './types';
import { useBusinessHours } from './useBusinessHours';
import styles from './BusinessHours.module.css';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Weekly availability editor — toggle each day open/closed and set open/close times. */
export function BusinessHours({ providerId, hours }: BusinessHoursProps) {
  const { days, saving, saved, error, toggleDay, setTime, save } = useBusinessHours(
    providerId,
    hours,
  );

  return (
    <section className={styles.card}>
      <div className={styles.head}>
        <Clock className={styles.headIcon} size={18} />
        <h3 className={styles.title}>Business hours</h3>
      </div>

      <div className={styles.list}>
        {days.map((d) => (
          <div key={d.dayOfWeek} className={styles.row}>
            <span className={styles.day}>{DAY_NAMES[d.dayOfWeek]}</span>

            <button
              type="button"
              className={`${styles.toggle} ${d.isOpen ? styles.toggleOpen : styles.toggleClosed}`}
              onClick={() => toggleDay(d.dayOfWeek)}
            >
              {d.isOpen ? 'Open' : 'Closed'}
            </button>

            {d.isOpen ? (
              <div className={styles.times}>
                <input
                  type="time"
                  className={styles.timeInput}
                  value={d.openTime}
                  onChange={(e) => setTime(d.dayOfWeek, 'openTime', e.target.value)}
                />
                <span className={styles.dash}>to</span>
                <input
                  type="time"
                  className={styles.timeInput}
                  value={d.closeTime}
                  onChange={(e) => setTime(d.dayOfWeek, 'closeTime', e.target.value)}
                />
              </div>
            ) : (
              <span className={styles.closedLabel}>Closed all day</span>
            )}
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <Button onClick={save} loading={saving}>
          Save hours
        </Button>
        {saved && <span className={styles.saved}>✓ Saved</span>}
        {error && <span className={styles.error}>{error}</span>}
      </div>
    </section>
  );
}
