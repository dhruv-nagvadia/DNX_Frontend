import { CalendarOff, ChevronLeft, ChevronRight, Clock, RotateCcw } from 'lucide-react';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Tabs } from '@/components/Tabs';
import { TimeField } from '@/components/TimeField';

import { BusinessCalendarProps } from './types';
import { CalendarDay, CalendarView, useBusinessCalendar, WEEKDAYS_SHORT } from './useBusinessCalendar';
import styles from './BusinessCalendar.module.css';

// Week-view vertical time axis.
const AXIS_START = 7; // 07:00
const AXIS_END = 22; // 22:00
const HOUR_PX = 44;

const timeFmt = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' });

const VIEW_TABS = [
  { id: 'month', label: 'Month' },
  { id: 'week', label: 'Week' },
];

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}
function hhmm(iso: string): string {
  return timeFmt.format(new Date(iso));
}
/** Minutes since AXIS_START for a "HH:MM" string. */
function minsFromClock(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h - AXIS_START) * 60 + m;
}
/** Minutes since AXIS_START for a date. */
function minsFromDate(iso: string): number {
  const d = new Date(iso);
  return (d.getHours() - AXIS_START) * 60 + d.getMinutes();
}
function fmtLongDate(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Month/week schedule with booked slots + per-date hour overrides. Picking a
 * date updates the side panel immediately — bookings and the hours editor
 * for that date sit together in one place, instead of a separate section
 * further down the page. */
export function BusinessCalendar({ providerId, businessHours }: BusinessCalendarProps) {
  const cal = useBusinessCalendar(providerId, businessHours);

  return (
    <Card
      title="Calendar"
      action={
        <Tabs
          tabs={VIEW_TABS}
          active={cal.view}
          onChange={(id) => cal.setView(id as CalendarView)}
        />
      }
    >
      <div className={styles.toolbar}>
        <div className={styles.nav}>
          <button type="button" className={styles.navBtn} onClick={cal.prev} aria-label="Previous">
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <button type="button" className={styles.navBtn} onClick={cal.next} aria-label="Next">
            <ChevronRight size={18} aria-hidden="true" />
          </button>
          <button type="button" className={styles.todayBtn} onClick={cal.today}>
            Today
          </button>
        </div>
        <h3 className={styles.period}>{cal.label}</h3>
      </div>

      <div className={styles.layout}>
        <div className={styles.gridCol}>
          {cal.view === 'month' ? <MonthView cal={cal} /> : <WeekView cal={cal} />}

          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <span className={`${styles.dot} ${styles.dotOpen}`} /> Open
            </span>
            <span className={styles.legendItem}>
              <span className={`${styles.dot} ${styles.dotClosed}`} /> Closed
            </span>
            <span className={styles.legendItem}>
              <span className={`${styles.dot} ${styles.dotOverride}`} /> Custom hours
            </span>
          </div>
        </div>

        <DayPanel cal={cal} />
      </div>
    </Card>
  );
}

type Cal = ReturnType<typeof useBusinessCalendar>;

/* ── Month grid ───────────────────────────────────────────────────── */
function MonthView({ cal }: { cal: Cal }) {
  return (
    <div className={styles.monthGrid}>
      {WEEKDAYS_SHORT.map((d) => (
        <div key={d} className={styles.dow}>
          {d}
        </div>
      ))}
      {cal.monthWeeks.flat().map((day) => {
        const selected = day.key === cal.selectedKey;
        return (
          <button
            key={day.key}
            type="button"
            onClick={() => cal.selectDay(day.key)}
            className={[
              styles.cell,
              day.inMonth ? '' : styles.cellMuted,
              !day.hours.isOpen ? styles.cellClosed : '',
              selected ? styles.cellSelected : '',
            ].join(' ')}
          >
            <span className={styles.cellTop}>
              <span className={`${styles.dayNum} ${day.isToday ? styles.dayNumToday : ''}`}>
                {day.date.getDate()}
              </span>
              {day.hours.source === 'override' && (
                <span className={styles.overrideDot} title="Custom hours" />
              )}
            </span>

            {day.hours.isOpen ? (
              <span className={styles.chips}>
                {day.bookings.slice(0, 2).map((b) => (
                  <span key={b.id} className={styles.chip}>
                    {hhmm(b.startTime)} {firstName(b.user.fullName)}
                  </span>
                ))}
                {day.bookings.length > 2 && (
                  <span className={styles.more}>+{day.bookings.length - 2} more</span>
                )}
              </span>
            ) : (
              <span className={styles.closedTag}>Closed</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ── Week timeline ────────────────────────────────────────────────── */
function WeekView({ cal }: { cal: Cal }) {
  const hours = Array.from({ length: AXIS_END - AXIS_START }, (_, i) => AXIS_START + i);
  const bodyHeight = (AXIS_END - AXIS_START) * HOUR_PX;

  return (
    <div className={styles.weekWrap}>
      <div className={styles.weekHead}>
        <span className={styles.axisSpacer} />
        {cal.weekDays.map((day) => (
          <button
            key={day.key}
            type="button"
            className={`${styles.weekHeadDay} ${day.key === cal.selectedKey ? styles.weekHeadDaySel : ''}`}
            onClick={() => cal.selectDay(day.key)}
          >
            <span className={styles.weekDow}>{WEEKDAYS_SHORT[day.date.getDay()]}</span>
            <span className={`${styles.weekDate} ${day.isToday ? styles.weekDateToday : ''}`}>
              {day.date.getDate()}
            </span>
          </button>
        ))}
      </div>

      <div className={styles.weekBody} style={{ height: bodyHeight }}>
        <div className={styles.axis}>
          {hours.map((h) => (
            <div key={h} className={styles.axisHour} style={{ height: HOUR_PX }}>
              <span className={styles.axisLabel}>{h % 12 === 0 ? 12 : h % 12}{h < 12 ? 'am' : 'pm'}</span>
            </div>
          ))}
        </div>

        {cal.weekDays.map((day) => (
          <div key={day.key} className={styles.weekCol}>
            {hours.map((h) => (
              <div key={h} className={styles.hourLine} style={{ height: HOUR_PX }} />
            ))}

            {day.hours.isOpen && <OpenBand day={day} />}

            {day.bookings.map((b) => {
              const top = Math.max(0, (minsFromDate(b.startTime) / 60) * HOUR_PX);
              const durMin =
                (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / 60000;
              const height = Math.max(20, (durMin / 60) * HOUR_PX - 2);
              return (
                <div
                  key={b.id}
                  className={styles.block}
                  style={{ top, height }}
                  title={`${hhmm(b.startTime)} · ${b.user.fullName} · ${b.service.name}`}
                >
                  <span className={styles.blockTime}>{hhmm(b.startTime)}</span>
                  <span className={styles.blockName}>{firstName(b.user.fullName)}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function OpenBand({ day }: { day: CalendarDay }) {
  const top = (minsFromClock(day.hours.openTime) / 60) * HOUR_PX;
  const height = ((minsFromClock(day.hours.closeTime) - minsFromClock(day.hours.openTime)) / 60) * HOUR_PX;
  if (height <= 0) return null;
  return <div className={styles.openBand} style={{ top, height: Math.max(0, height) }} />;
}

/* ── Day panel: bookings + the hours editor for the selected date, both in
   one place next to the grid — picking a date is the only step needed. ──── */
function DayPanel({ cal }: { cal: Cal }) {
  const { selectedDay, form, setForm, saveOverride, resetOverride, saving, removing, hasOverride } =
    cal;

  return (
    <aside className={styles.dayPanel}>
      <div className={styles.dayPanelHead}>
        <span className={styles.dayPanelDate}>{fmtLongDate(cal.selectedKey)}</span>
        <span className={styles.dayPanelStatus}>
          {selectedDay.hours.isOpen
            ? `Open ${selectedDay.hours.openTime}–${selectedDay.hours.closeTime}`
            : 'Closed'}
          {selectedDay.hours.source === 'override' && (
            <span className={styles.customTag}>Custom</span>
          )}
        </span>
      </div>

      <div className={styles.dayPanelSection}>
        <div className={styles.dayPanelSectionTitle}>Bookings</div>
        {selectedDay.bookings.length > 0 ? (
          <ul className={styles.dayBookings}>
            {selectedDay.bookings.map((b) => (
              <li key={b.id} className={styles.dayBooking}>
                <span className={styles.dbTime}>
                  {hhmm(b.startTime)}–{hhmm(b.endTime)}
                </span>
                <span className={styles.dbWho}>{b.user.fullName}</span>
                <span className={styles.dbService}>{b.service.name}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.noBookings}>
            <CalendarOff size={15} aria-hidden="true" /> No bookings on this date.
          </p>
        )}
      </div>

      <div className={styles.dayPanelSection}>
        <div className={styles.dayPanelSectionTitle}>
          <Clock size={14} aria-hidden="true" /> Hours for this date
        </div>

        <label className={styles.openRow}>
          <button
            type="button"
            className={`${styles.switch} ${form.isOpen ? styles.switchOn : ''}`}
            onClick={() => setForm({ ...form, isOpen: !form.isOpen })}
            aria-pressed={form.isOpen}
            aria-label={form.isOpen ? 'Open' : 'Closed'}
          >
            <span className={styles.knob} />
          </button>
          <span>{form.isOpen ? 'Open' : 'Closed'}</span>
        </label>

        {form.isOpen && (
          <div className={styles.times}>
            <TimeField
              className={styles.timeField}
              value={form.openTime}
              onChange={(v) => setForm({ ...form, openTime: v })}
              aria-label="Opening time"
            />
            <span className={styles.dash}>to</span>
            <TimeField
              className={styles.timeField}
              value={form.closeTime}
              onChange={(v) => setForm({ ...form, closeTime: v })}
              aria-label="Closing time"
            />
          </div>
        )}

        <div className={styles.editorActions}>
          <Button onClick={saveOverride} loading={saving} loadingText="Saving…" fullWidth>
            Save for this date
          </Button>
          {hasOverride && (
            <Button
              variant="ghost"
              onClick={resetOverride}
              loading={removing}
              loadingText="Removing…"
              iconLeft={<RotateCcw size={15} aria-hidden="true" />}
              fullWidth
            >
              Reset to weekly
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
