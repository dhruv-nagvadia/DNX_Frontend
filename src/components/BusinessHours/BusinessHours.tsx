import { Check } from 'lucide-react';

import { AlertBanner } from '@/components/AlertBanner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
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
    <Card title="Business hours" subtitle="When customers can book you each day.">
      <div className={styles.list}>
        {days.map((d) => (
          <div key={d.dayOfWeek} className={`${styles.row} ${d.isOpen ? '' : styles.rowClosed}`}>
            <span className={styles.day}>{DAY_NAMES[d.dayOfWeek]}</span>

            <button
              type="button"
              className={`${styles.toggle} ${d.isOpen ? styles.toggleOpen : styles.toggleClosed}`}
              onClick={() => toggleDay(d.dayOfWeek)}
              aria-pressed={d.isOpen}
              aria-label={`${DAY_NAMES[d.dayOfWeek]} is ${d.isOpen ? 'open' : 'closed'}`}
            >
              <span className={styles.knob} aria-hidden="true" />
              <span className={styles.toggleText}>{d.isOpen ? 'Open' : 'Closed'}</span>
            </button>

            {d.isOpen ? (
              <div className={styles.times}>
                <input
                  type="time"
                  className={styles.timeInput}
                  value={d.openTime}
                  onChange={(e) => setTime(d.dayOfWeek, 'openTime', e.target.value)}
                  aria-label={`${DAY_NAMES[d.dayOfWeek]} opening time`}
                />
                <span className={styles.dash}>to</span>
                <input
                  type="time"
                  className={styles.timeInput}
                  value={d.closeTime}
                  onChange={(e) => setTime(d.dayOfWeek, 'closeTime', e.target.value)}
                  aria-label={`${DAY_NAMES[d.dayOfWeek]} closing time`}
                />
              </div>
            ) : (
              <span className={styles.closedLabel}>Closed all day</span>
            )}
          </div>
        ))}
      </div>

      {error && <AlertBanner tone="error">{error}</AlertBanner>}

      <div className={styles.footer}>
        <Button onClick={save} loading={saving} loadingText="Saving…">
          Save hours
        </Button>
        {saved && (
          <span className={styles.saved} role="status">
            <Check size={15} aria-hidden="true" /> Saved
          </span>
        )}
      </div>
    </Card>
  );
}
