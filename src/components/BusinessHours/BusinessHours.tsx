import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  Clock,
  Coffee,
  Copy,
  DoorOpen,
  Eye,
  Info,
  Loader2,
  Store,
  Timer,
} from 'lucide-react';

import { TimeField } from '@/components/TimeField';
import { ModernCard } from '@/components/ModernCard';
import { useGetDateHoursQuery } from '@/redux/api/provider/providerApi';
import { BusinessHoursProps } from './types';
import { useBusinessHours } from './useBusinessHours';
import {
  DAY_NAMES,
  WEEK_ORDER,
  breakFits,
  computeStatus,
  fmt12,
  fmtDuration,
  fmtRange,
  fmtShort,
  groupWeek,
  isoDate,
  openMinutes,
  toMinutes,
} from './hoursUtils';
import styles from './BusinessHours.module.css';

/** The current time, refreshed every 30 s so "Open now" stays accurate. */
function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

/** Blue on/off switch. */
function Switch({
  on,
  onToggle,
  label,
}: {
  on: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`${styles.switch} ${on ? styles.switchOn : ''}`}
      onClick={onToggle}
    >
      <span className={styles.switchKnob} aria-hidden="true" />
    </button>
  );
}

/**
 * Business Detail → Hours tab ("Salon Hours Management Dashboard.png"): summary
 * tiles, the weekly schedule editor, one shared daily break, and a live
 * preview of what customers see.
 */
export function BusinessHours({
  providerId,
  hours,
  businessName,
  coverImage,
  onOpenCalendar,
}: BusinessHoursProps) {
  const {
    days,
    hasBreak,
    breakStart,
    breakEnd,
    dirty,
    saving,
    error,
    toggleDay,
    setTime,
    copyMondayToAll,
    toggleBreak,
    setBreakTime,
    discard,
    save,
  } = useBusinessHours(providerId, hours);

  const now = useNow();
  const todayDow = now.getDay();
  const todayKey = isoDate(now);
  const weekAheadKey = useMemo(() => {
    const d = new Date(`${todayKey}T00:00:00`);
    d.setDate(d.getDate() + 7);
    return isoDate(d);
  }, [todayKey]);

  // Date-specific overrides for today (and the week ahead, so "Opens <Day>"
  // also respects them).
  const { data: overrides } = useGetDateHoursQuery(
    { id: providerId, from: todayKey, to: weekAheadKey },
    { skip: !providerId },
  );

  // Live status uses what's SAVED, not unsaved edits.
  const status = useMemo(
    () => computeStatus(now, hours, overrides ?? []),
    [now, hours, overrides],
  );

  const orderedDays = useMemo(
    () =>
      WEEK_ORDER.map((dow) => days.find((d) => d.dayOfWeek === dow)).filter(
        (d): d is NonNullable<typeof d> => !!d,
      ),
    [days],
  );
  const openCount = days.filter((d) => d.isOpen).length;
  const weeklyMinutes = days.reduce(
    (sum, d) => sum + openMinutes(d, hasBreak, breakStart, breakEnd),
    0,
  );
  const weekGroups = useMemo(() => groupWeek(days), [days]);

  const statusLabel =
    status.state === 'open' ? 'Open' : status.state === 'break' ? 'On break' : 'Closed';

  return (
    <div className={styles.root}>
      {/* ── Summary tiles ─────────────────────────────────────────── */}
      <div className={styles.tiles}>
        <div className={`${styles.tile} ${styles.tile_mint}`}>
          <span className={styles.tileIcon}>
            <DoorOpen size={28} aria-hidden="true" />
          </span>
          <div className={styles.tileText}>
            <span className={styles.tileLabel}>Open Now</span>
            <span className={styles.tileValue}>{statusLabel}</span>
            <span className={styles.tileSub}>{status.detail}</span>
          </div>
        </div>
        <div className={`${styles.tile} ${styles.tile_blue}`}>
          <span className={styles.tileIcon}>
            <CalendarDays size={28} aria-hidden="true" />
          </span>
          <div className={styles.tileText}>
            <span className={styles.tileLabel}>Open Days</span>
            <span className={styles.tileValue}>{openCount} / 7</span>
          </div>
        </div>
        <div className={`${styles.tile} ${styles.tile_lavender}`}>
          <span className={styles.tileIcon}>
            <Timer size={28} aria-hidden="true" />
          </span>
          <div className={styles.tileText}>
            <span className={styles.tileLabel}>Hours per Week</span>
            <span className={styles.tileValue}>{fmtDuration(weeklyMinutes)}</span>
          </div>
        </div>
        <div className={`${styles.tile} ${styles.tile_peach}`}>
          <span className={styles.tileIcon}>
            <Coffee size={28} aria-hidden="true" />
          </span>
          <div className={styles.tileText}>
            <span className={styles.tileLabel}>Daily Break</span>
            <span className={styles.tileValue}>
              {hasBreak ? fmtRange(breakStart, breakEnd) : 'No break'}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.columns}>
        {/* ── Weekly schedule ──────────────────────────────────────── */}
        <ModernCard
          className={styles.scheduleCard}
          icon={<Clock size={22} aria-hidden="true" />}
          iconTone="ink"
          title="Weekly Schedule"
          action={
            <button type="button" className={styles.copyBtn} onClick={copyMondayToAll}>
              <Copy size={16} aria-hidden="true" /> Copy Monday to all days
            </button>
          }
        >
          <div className={styles.list}>
            {orderedDays.map((d) => {
              const name = DAY_NAMES[d.dayOfWeek];
              const isToday = d.dayOfWeek === todayDow;
              const span =
                d.closeTime > d.openTime ? toMinutes(d.closeTime) - toMinutes(d.openTime) : 0;
              const showBreak = hasBreak && breakFits(d, breakStart, breakEnd);
              return (
                <div
                  key={d.dayOfWeek}
                  className={`${styles.row} ${isToday ? styles.rowToday : ''} ${
                    d.isOpen ? '' : styles.rowClosed
                  }`}
                >
                  <div className={styles.dayCell}>
                    <span className={styles.day}>{name}</span>
                    {isToday && <span className={styles.todayPill}>Today</span>}
                  </div>

                  <div className={styles.toggleCell}>
                    <Switch
                      on={d.isOpen}
                      onToggle={() => toggleDay(d.dayOfWeek)}
                      label={`${name} open`}
                    />
                    <span className={styles.toggleText}>{d.isOpen ? 'Open' : 'Closed'}</span>
                  </div>

                  {d.isOpen ? (
                    <div className={styles.timesCell}>
                      <div className={styles.times}>
                        <TimeField
                          className={styles.timePill}
                          value={d.openTime}
                          onChange={(v) => setTime(d.dayOfWeek, 'openTime', v)}
                          aria-label={`${name} opening time`}
                        />
                        <span className={styles.dash} aria-hidden="true">
                          –
                        </span>
                        <TimeField
                          className={styles.timePill}
                          value={d.closeTime}
                          onChange={(v) => setTime(d.dayOfWeek, 'closeTime', v)}
                          aria-label={`${name} closing time`}
                        />
                      </div>
                      <span className={styles.duration}>{fmtDuration(span)}</span>
                      {showBreak && (
                        <span className={styles.breakChip}>
                          Break {fmtShort(breakStart)}–{fmtShort(breakEnd)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className={styles.closedBar}>Closed all day</div>
                  )}
                </div>
              );
            })}
          </div>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <div className={styles.footer}>
            <span className={styles.footerNote} role="status">
              {dirty ? 'You have unsaved changes' : 'All changes saved'}
            </span>
            <div className={styles.footerActions}>
              <button
                type="button"
                className={styles.outlineBtn}
                onClick={discard}
                disabled={!dirty || saving}
              >
                Discard
              </button>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={save}
                disabled={!dirty || saving}
              >
                {saving && <Loader2 size={16} className={styles.spin} aria-hidden="true" />}
                {saving ? 'Saving…' : 'Save Hours'}
              </button>
            </div>
          </div>
        </ModernCard>

        <div className={styles.side}>
          {/* ── Daily break ────────────────────────────────────────── */}
          <ModernCard
            icon={<Coffee size={22} aria-hidden="true" />}
            iconTone="ink"
            title="Daily Break"
          >
            <div className={styles.breakHead}>
              <Switch on={hasBreak} onToggle={toggleBreak} label="Take a daily break" />
              <div className={styles.breakHeadText}>
                <span className={styles.breakTitle}>Take a daily break</span>
                <span className={styles.breakSub}>Applied to every open day it fits inside.</span>
              </div>
            </div>
            {hasBreak && (
              <div className={styles.breakTimes}>
                <TimeField
                  className={`${styles.timePill} ${styles.timePillWide}`}
                  value={breakStart}
                  onChange={(v) => setBreakTime('breakStart', v)}
                  aria-label="Break start time"
                />
                <span className={styles.dash} aria-hidden="true">
                  –
                </span>
                <TimeField
                  className={`${styles.timePill} ${styles.timePillWide}`}
                  value={breakEnd}
                  onChange={(v) => setBreakTime('breakEnd', v)}
                  aria-label="Break end time"
                />
              </div>
            )}
            <div className={styles.infoBox}>
              <Info size={18} aria-hidden="true" />
              <span>Customers can&apos;t book during the break.</span>
            </div>
          </ModernCard>

          {/* ── Customer preview ───────────────────────────────────── */}
          <ModernCard
            icon={<Eye size={22} aria-hidden="true" />}
            iconTone="ink"
            title="Customer Preview"
          >
            <div className={styles.preview}>
              <div className={styles.previewHead}>
                <div className={styles.previewThumb}>
                  {coverImage ? (
                    <img src={coverImage} alt="" className={styles.previewImg} />
                  ) : (
                    <Store size={28} aria-hidden="true" />
                  )}
                </div>
                <div className={styles.previewInfo}>
                  <span className={styles.previewName}>{businessName || 'Your business'}</span>
                  <span
                    className={`${styles.statusPill} ${
                      status.state === 'open'
                        ? styles.statusOpen
                        : status.state === 'break'
                          ? styles.statusBreak
                          : styles.statusClosed
                    }`}
                  >
                    <span className={styles.statusDot} aria-hidden="true" />
                    {status.state === 'open'
                      ? 'Open now'
                      : status.state === 'break'
                        ? 'On break'
                        : 'Closed now'}
                  </span>
                  <span className={styles.previewToday}>
                    Today{' '}
                    {status.today.isOpen
                      ? `${fmt12(status.today.openTime)} – ${fmt12(status.today.closeTime)}`
                      : 'Closed'}
                  </span>
                </div>
              </div>

              <ul className={styles.weekList}>
                {weekGroups.map((g) => (
                  <li key={g.label} className={styles.weekRow}>
                    <CalendarDays size={18} className={styles.weekIcon} aria-hidden="true" />
                    <span className={styles.weekLabel}>{g.label}</span>
                    <span className={styles.weekValue}>{g.value}</span>
                  </li>
                ))}
                {hasBreak && (
                  <li className={styles.weekRow}>
                    <Coffee size={18} className={styles.weekIcon} aria-hidden="true" />
                    <span className={styles.weekLabel}>Break</span>
                    <span className={styles.weekValue}>{fmtRange(breakStart, breakEnd)} daily</span>
                  </li>
                )}
              </ul>
            </div>
          </ModernCard>

          {/* ── Holiday tip ────────────────────────────────────────── */}
          <div className={styles.tip}>
            <CalendarDays size={26} className={styles.tipIcon} aria-hidden="true" />
            <div className={styles.tipText}>
              <span className={styles.tipTitle}>Holiday or special hours?</span>
              <span className={styles.tipBody}>
                Set them for a specific date in the{' '}
                {onOpenCalendar ? (
                  <button type="button" className={styles.tipLink} onClick={onOpenCalendar}>
                    Calendar tab <ArrowRight size={15} aria-hidden="true" />
                  </button>
                ) : (
                  <strong>Calendar tab</strong>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
