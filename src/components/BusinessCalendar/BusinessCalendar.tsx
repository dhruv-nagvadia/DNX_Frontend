import {
  CalendarCheck,
  CalendarDays,
  CalendarX,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  Flame,
  Loader2,
  Save,
} from 'lucide-react';

import { ModernCard, ModernCardLink } from '@/components/ModernCard';
import { Pill, PillTone } from '@/components/Pill';
import { TimeField } from '@/components/TimeField';
import { formatMoney } from '@/utils/money';

import { BusinessCalendarProps } from './types';
import {
  CalendarDay,
  CalendarView,
  ItemStatus,
  useBusinessCalendar,
  WEEKDAYS_SHORT,
} from './useBusinessCalendar';
import styles from './BusinessCalendar.module.css';

// Week-view vertical time axis.
const AXIS_START = 7; // 07:00
const AXIS_END = 22; // 22:00
const HOUR_PX = 44;

const timeFmt = new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

const STATUS_PILL: Record<ItemStatus, { tone: PillTone; label: string }> = {
  PENDING: { tone: 'orange', label: 'Pending' },
  CONFIRMED: { tone: 'blue', label: 'Confirmed' },
  IN_PROGRESS: { tone: 'teal', label: 'In progress' },
  READY: { tone: 'green', label: 'Ready' },
  COMPLETED: { tone: 'green', label: 'Completed' },
  CANCELLED: { tone: 'grey', label: 'Cancelled' },
  NO_SHOW: { tone: 'red', label: 'No-show' },
};

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}
/** "10:00 AM" */
function hhmm(iso: string): string {
  return timeFmt.format(new Date(iso)).toUpperCase();
}
/** "17:00" → "5:00" (compact 12-hour, for the small custom-hours chip). */
function compact12(t: string): string {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')}`;
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
function fmtPanelDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}
function fmtShortDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

type Cal = ReturnType<typeof useBusinessCalendar>;

/**
 * Business Detail → Calendar tab ("DNX Marketplace Salon Calendar Dashboard.png"):
 * month tiles, a month/week calendar, and a day panel with that date's hours
 * editor, bookings (or orders) and earnings.
 */
export function BusinessCalendar({
  providerId,
  businessHours,
  businessType,
  onViewAll,
}: BusinessCalendarProps) {
  const cal = useBusinessCalendar(providerId, businessHours, businessType);
  const word = cal.itemLabel; // 'booking' | 'order'
  const Word = word === 'order' ? 'Orders' : 'Bookings';
  const { monthStats } = cal;

  return (
    <div className={styles.root}>
      {/* ── Month tiles ──────────────────────────────────────────────── */}
      <div className={styles.tiles}>
        <div className={`${styles.tile} ${styles.tile_blue}`}>
          <span className={styles.tileIcon}>
            <CalendarCheck size={28} aria-hidden="true" />
          </span>
          <div className={styles.tileText}>
            <span className={styles.tileLabel}>{Word} This Month</span>
            <span className={styles.tileValue}>{monthStats.count}</span>
          </div>
        </div>
        <div className={`${styles.tile} ${styles.tile_lavender}`}>
          <span className={styles.tileIcon}>
            <Flame size={28} aria-hidden="true" />
          </span>
          <div className={styles.tileText}>
            <span className={styles.tileLabel}>Busiest Day</span>
            {monthStats.busiest ? (
              <span className={styles.tileValueSm}>
                {fmtShortDate(monthStats.busiest.date)} •{' '}
                <span className={styles.tileValueSmSoft}>{plural(monthStats.busiest.count, word)}</span>
              </span>
            ) : (
              <span className={styles.tileValue}>—</span>
            )}
          </div>
        </div>
        <div className={`${styles.tile} ${styles.tile_pink}`}>
          <span className={styles.tileIcon}>
            <CalendarX size={28} aria-hidden="true" />
          </span>
          <div className={styles.tileText}>
            <span className={styles.tileLabel}>Closed Days</span>
            <span className={styles.tileValue}>{monthStats.closedDays}</span>
            <span className={styles.tileSub}>Weekly closed days + closed dates</span>
          </div>
        </div>
        <div className={`${styles.tile} ${styles.tile_peach}`}>
          <span className={styles.tileIcon}>
            <Clock size={28} aria-hidden="true" />
          </span>
          <div className={styles.tileText}>
            <span className={styles.tileLabel}>Custom Hours</span>
            <span className={styles.tileValue}>{monthStats.customDays}</span>
            <span className={styles.tileSub}>Dates with overridden hours</span>
          </div>
        </div>
      </div>

      <div className={styles.columns}>
        {/* ── Calendar card ────────────────────────────────────────────── */}
        <section className={styles.calCard}>
          <div className={styles.toolbar}>
            <div className={styles.nav}>
              <button type="button" className={styles.navBtn} onClick={cal.prev} aria-label="Previous">
                <ChevronLeft size={22} aria-hidden="true" />
              </button>
              <h3 className={styles.period}>{cal.label}</h3>
              <button type="button" className={styles.navBtn} onClick={cal.next} aria-label="Next">
                <ChevronRight size={22} aria-hidden="true" />
              </button>
            </div>
            <div className={styles.toolbarRight}>
              <button type="button" className={styles.todayBtn} onClick={cal.today}>
                Today
              </button>
              <div className={styles.segment} role="tablist" aria-label="Calendar view">
                {(['month', 'week'] as CalendarView[]).map((v) => (
                  <button
                    key={v}
                    type="button"
                    role="tab"
                    aria-selected={cal.view === v}
                    className={`${styles.segBtn} ${cal.view === v ? styles.segBtnOn : ''}`}
                    onClick={() => cal.setView(v)}
                  >
                    {v === 'month' ? 'Month' : 'Week'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {cal.view === 'month' ? <MonthView cal={cal} /> : <WeekView cal={cal} />}

          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.legendCount}`} /> {Word} (count)
            </span>
            <span className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.legendClosed}`} /> Closed
            </span>
            <span className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.legendCustom}`} /> Custom hours (overridden)
            </span>
            <span className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.legendToday}`} /> Today
            </span>
          </div>
        </section>

        <DayPanel cal={cal} onViewAll={onViewAll} />
      </div>
    </div>
  );
}

/* ── Shared bits of a day (month cell + week header card) ──────────── */
function Dots({ day }: { day: CalendarDay }) {
  if (!day.dots.length) return null;
  return (
    <span className={styles.dots} aria-hidden="true">
      {day.dots.map((t) => (
        <span key={t} className={`${styles.statusDot} ${styles[`dot_${t}`]}`} />
      ))}
    </span>
  );
}

function DayBody({ day, word }: { day: CalendarDay; word: string }) {
  return (
    <span className={styles.cellBody}>
      {day.closedBy === 'weekly' && <span className={styles.closedText}>Closed</span>}
      {day.closedBy === 'override' && <span className={styles.closedChip}>Closed</span>}
      {day.customHours && (
        <span className={styles.customChip}>
          {compact12(day.hours.openTime)}–{compact12(day.hours.closeTime)}
        </span>
      )}
      {day.count > 0 && (
        <>
          <span className={styles.countPill}>
            <span className={styles.countFull}>{plural(day.count, word)}</span>
            <span className={styles.countShort}>{day.count}</span>
          </span>
          {day.earningsMinor > 0 && (
            <span className={styles.earn}>{formatMoney(day.earningsMinor)}</span>
          )}
        </>
      )}
    </span>
  );
}

function dayStateClass(day: CalendarDay, selectedKey: string): string {
  return [
    day.closedBy === 'weekly' ? styles.cellClosed : '',
    day.closedBy === 'override' ? styles.cellClosedOverride : '',
    day.customHours ? styles.cellCustom : '',
    day.isToday ? styles.cellToday : '',
    day.key === selectedKey ? styles.cellSelected : '',
  ].join(' ');
}

/* ── Month grid ───────────────────────────────────────────────────── */
function MonthView({ cal }: { cal: Cal }) {
  return (
    <div className={styles.monthGrid}>
      {WEEKDAYS_SHORT.map((d) => (
        <div key={d} className={styles.dow}>
          {d}
        </div>
      ))}
      {cal.monthWeeks.flat().map((day) =>
        day.inMonth ? (
          <button
            key={day.key}
            type="button"
            onClick={() => cal.selectDay(day.key)}
            aria-pressed={day.key === cal.selectedKey}
            className={`${styles.cell} ${dayStateClass(day, cal.selectedKey)}`}
          >
            <span className={styles.cellTop}>
              <span className={styles.dayNum}>{day.date.getDate()}</span>
              <Dots day={day} />
            </span>
            <DayBody day={day} word={cal.itemLabel} />
          </button>
        ) : (
          <button
            key={day.key}
            type="button"
            onClick={() => cal.selectDay(day.key)}
            className={`${styles.cell} ${styles.cellMuted}`}
            aria-label={day.date.toDateString()}
          >
            <span className={styles.cellTop}>
              <span className={styles.dayNum}>{day.date.getDate()}</span>
            </span>
          </button>
        ),
      )}
    </div>
  );
}

/* ── Week: day cards + timeline ───────────────────────────────────── */
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
            aria-pressed={day.key === cal.selectedKey}
            className={`${styles.cell} ${styles.weekCard} ${dayStateClass(day, cal.selectedKey)}`}
            onClick={() => cal.selectDay(day.key)}
          >
            <span className={styles.weekDow}>{WEEKDAYS_SHORT[day.date.getDay()]}</span>
            <span className={styles.cellTop}>
              <span className={styles.dayNum}>{day.date.getDate()}</span>
              <Dots day={day} />
            </span>
            <DayBody day={day} word={cal.itemLabel} />
          </button>
        ))}
      </div>

      <div className={styles.weekBody} style={{ height: bodyHeight }}>
        <div className={styles.axis}>
          {hours.map((h) => (
            <div key={h} className={styles.axisHour} style={{ height: HOUR_PX }}>
              <span className={styles.axisLabel}>
                {h % 12 === 0 ? 12 : h % 12}
                {h < 12 ? 'am' : 'pm'}
              </span>
            </div>
          ))}
        </div>

        {cal.weekDays.map((day) => (
          <div
            key={day.key}
            className={`${styles.weekCol} ${day.key === cal.selectedKey ? styles.weekColSel : ''}`}
          >
            {hours.map((h) => (
              <div key={h} className={styles.hourLine} style={{ height: HOUR_PX }} />
            ))}

            {day.hours.isOpen && <OpenBand day={day} />}

            {day.items.map((item) => {
              const top = Math.max(0, (minsFromDate(item.time) / 60) * HOUR_PX);
              // Orders have no end time — show them as a fixed-size marker instead of a span.
              const durMin = item.endTime
                ? (new Date(item.endTime).getTime() - new Date(item.time).getTime()) / 60000
                : 30;
              const height = Math.max(20, (durMin / 60) * HOUR_PX - 2);
              return (
                <div
                  key={item.id}
                  className={`${styles.block} ${styles[`block_${STATUS_PILL[item.status].tone}`]}`}
                  style={{ top, height }}
                  title={`${hhmm(item.time)} · ${item.title} · ${item.subtitle} · ${STATUS_PILL[item.status].label}`}
                >
                  <span className={styles.blockTime}>{hhmm(item.time)}</span>
                  <span className={styles.blockName}>{firstName(item.title)}</span>
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
  const height =
    ((minsFromClock(day.hours.closeTime) - minsFromClock(day.hours.openTime)) / 60) * HOUR_PX;
  if (height <= 0) return null;
  return (
    <div
      className={`${styles.openBand} ${day.customHours ? styles.openBandCustom : ''}`}
      style={{ top, height }}
    />
  );
}

/* ── Day panel: hours editor + that date's bookings/orders + earnings ── */
function DayPanel({ cal, onViewAll }: { cal: Cal; onViewAll?: () => void }) {
  const { selectedDay, form, setForm, saveOverride, resetOverride, saving, removing, hasOverride, dirty } =
    cal;
  const Word = cal.itemLabel === 'order' ? 'Orders' : 'Bookings';
  const words = cal.itemLabel === 'order' ? 'orders' : 'bookings';

  const statePill = !hasOverride ? (
    <Pill tone="grey" className={styles.statePill}>
      Weekly default
    </Pill>
  ) : selectedDay.hours.isOpen ? (
    <Pill tone="orange" className={styles.statePill}>
      Custom hours
    </Pill>
  ) : (
    <Pill tone="red" className={styles.statePill}>
      Closed (override)
    </Pill>
  );

  return (
    <aside className={styles.side}>
      <ModernCard
        icon={<CalendarDays size={22} aria-hidden="true" />}
        iconTone="ink"
        title={fmtPanelDate(selectedDay.date)}
      >
        <div className={styles.hoursBox}>
          <div className={styles.hoursHead}>
            <span className={styles.hoursTitle}>
              <Clock size={20} aria-hidden="true" /> Hours for this date
            </span>
            {statePill}
          </div>

          <div className={styles.openRow}>
            <button
              type="button"
              role="switch"
              aria-checked={form.isOpen}
              aria-label={form.isOpen ? 'Open' : 'Closed'}
              className={`${styles.switch} ${form.isOpen ? styles.switchOn : ''}`}
              onClick={() => setForm({ ...form, isOpen: !form.isOpen })}
            >
              <span className={styles.switchKnob} aria-hidden="true" />
            </button>
            <span className={styles.openLabel}>{form.isOpen ? 'Open' : 'Closed'}</span>
          </div>

          {form.isOpen && (
            <div className={styles.times}>
              <TimeField
                className={styles.timePill}
                value={form.openTime}
                onChange={(v) => setForm({ ...form, openTime: v })}
                aria-label="Opening time"
              />
              <span className={styles.dash}>–</span>
              <TimeField
                className={styles.timePill}
                value={form.closeTime}
                onChange={(v) => setForm({ ...form, closeTime: v })}
                aria-label="Closing time"
              />
            </div>
          )}

          <div className={styles.hoursActions}>
            <button
              type="button"
              className={styles.saveBtn}
              onClick={saveOverride}
              disabled={saving || removing || !dirty}
            >
              {saving ? (
                <Loader2 size={16} className={styles.spin} aria-hidden="true" />
              ) : (
                <Save size={16} aria-hidden="true" />
              )}
              {saving ? 'Saving…' : 'Save for this date'}
            </button>
            {hasOverride && (
              <button
                type="button"
                className={styles.resetLink}
                onClick={resetOverride}
                disabled={saving || removing}
              >
                {removing ? 'Resetting…' : 'Reset to weekly default'}
              </button>
            )}
          </div>
          {cal.error && (
            <p className={styles.error} role="alert">
              {cal.error}
            </p>
          )}
          <p className={styles.note}>Changes only this date. Weekly hours stay the same.</p>
        </div>
      </ModernCard>

      <ModernCard
        icon={<CalendarDays size={22} aria-hidden="true" />}
        iconTone="ink"
        title={`${Word} (${selectedDay.items.length})`}
        action={
          onViewAll ? (
            <ModernCardLink onClick={onViewAll} iconRight={<ChevronRight size={16} aria-hidden="true" />}>
              View all
            </ModernCardLink>
          ) : undefined
        }
      >
        {selectedDay.items.length > 0 ? (
          <ul className={styles.list}>
            {selectedDay.items.map((item) => {
              const pill = STATUS_PILL[item.status];
              return (
                <li key={item.id} className={styles.row}>
                  <span className={styles.rowTime}>{hhmm(item.time)}</span>
                  <span className={styles.rowText}>
                    <span className={styles.rowName}>{item.title}</span>
                    <span className={styles.rowSub}>
                      {item.subtitle} • {formatMoney(item.amountMinor)}
                    </span>
                  </span>
                  <Pill tone={pill.tone} className={styles.rowPill}>
                    {pill.label}
                  </Pill>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className={styles.empty}>No {words} on this date.</p>
        )}

        <div className={styles.earnBar}>
          <span className={styles.earnIcon}>
            <Coins size={26} aria-hidden="true" />
          </span>
          <span className={styles.earnText}>
            <span className={styles.earnLabel}>Day earnings</span>
            <span className={styles.earnValue}>{formatMoney(selectedDay.earningsMinor)}</span>
          </span>
          {selectedDay.pendingCount > 0 && (
            <span className={styles.earnPending}>{selectedDay.pendingCount} pending to confirm</span>
          )}
        </div>
      </ModernCard>
    </aside>
  );
}
