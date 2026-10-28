import { Check, Coffee, Plus, X } from 'lucide-react';

import { AlertBanner } from '@/components/AlertBanner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { TimeField } from '@/components/TimeField';
import { BusinessHoursProps } from './types';
import { useBusinessHours } from './useBusinessHours';
import styles from './BusinessHours.module.css';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Weekly availability editor — toggle each day open/closed, set open/close
 * times, and optionally block out one shared midday break (applied to every
 * open day) so it never shows up as a bookable slot to customers. */
export function BusinessHours({ providerId, hours }: BusinessHoursProps) {
  const {
    days,
    hasBreak,
    breakStart,
    breakEnd,
    dirty,
    saving,
    saved,
    error,
    toggleDay,
    setTime,
    toggleBreak,
    setBreakTime,
    save,
  } = useBusinessHours(providerId, hours);

  return (
    <Card title="Business hours">
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
                <TimeField
                  className={styles.timeField}
                  value={d.openTime}
                  onChange={(v) => setTime(d.dayOfWeek, 'openTime', v)}
                  aria-label={`${DAY_NAMES[d.dayOfWeek]} opening time`}
                />
                <span className={styles.dash}>to</span>
                <TimeField
                  className={styles.timeField}
                  value={d.closeTime}
                  onChange={(v) => setTime(d.dayOfWeek, 'closeTime', v)}
                  aria-label={`${DAY_NAMES[d.dayOfWeek]} closing time`}
                />
              </div>
            ) : (
              <span className={styles.closedLabel}>Closed all day</span>
            )}
          </div>
        ))}
      </div>

      <div className={styles.breakSection}>
        <div className={styles.breakSectionHead}>
          <div className={styles.breakSectionHeadText}>
            <span className={styles.breakSectionTitle}>
              <Coffee size={14} aria-hidden="true" /> Break time
            </span>
            <span className={styles.breakSectionSub}>
              Applies to every open day, so customers can't book it.
            </span>
          </div>
          {hasBreak && (
            <button
              type="button"
              className={styles.removeBreakBtn}
              onClick={toggleBreak}
              aria-label="Remove break time"
            >
              <X size={18} aria-hidden="true" />
            </button>
          )}
        </div>

        {hasBreak ? (
          <div className={styles.breakRow}>
            <TimeField
              className={styles.timeField}
              value={breakStart}
              onChange={(v) => setBreakTime('breakStart', v)}
              aria-label="Break start time"
            />
            <span className={styles.dash}>to</span>
            <TimeField
              className={styles.timeField}
              value={breakEnd}
              onChange={(v) => setBreakTime('breakEnd', v)}
              aria-label="Break end time"
            />
          </div>
        ) : (
          <button type="button" className={styles.addBreakBtn} onClick={toggleBreak}>
            <Plus size={13} aria-hidden="true" /> Add break time
          </button>
        )}
      </div>

      {error && <AlertBanner tone="error">{error}</AlertBanner>}

      <div className={styles.footer}>
        <Button onClick={save} loading={saving} loadingText="Saving…" disabled={!dirty}>
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
