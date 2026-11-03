import { BusinessHour, DateHour } from '@/redux/api/provider/types';

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
/** Display order for the week — Monday first. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

/** "HH:MM" → minutes since midnight. */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map((n) => Number(n) || 0);
  return h * 60 + m;
}

function parts(hhmm: string) {
  const [h24, m] = hhmm.split(':').map((n) => Number(n) || 0);
  return { h12: h24 % 12 || 12, m: String(m).padStart(2, '0'), mer: h24 >= 12 ? 'PM' : 'AM' };
}

/** "20:00" → "8:00 PM". */
export function fmt12(hhmm: string): string {
  const { h12, m, mer } = parts(hhmm);
  return `${h12}:${m} ${mer}`;
}

/** "13:00" → "1:00" (no AM/PM). */
export function fmtShort(hhmm: string): string {
  const { h12, m } = parts(hhmm);
  return `${h12}:${m}`;
}

/** "13:00","14:00" → "1:00 – 2:00 PM"; "11:30","12:30" → "11:30 AM – 12:30 PM". */
export function fmtRange(start: string, end: string): string {
  const a = parts(start);
  const b = parts(end);
  if (a.mer === b.mer) return `${a.h12}:${a.m} – ${b.h12}:${b.m} ${b.mer}`;
  return `${fmt12(start)} – ${fmt12(end)}`;
}

/** 630 → "10h 30m", 600 → "10h". */
export function fmtDuration(totalMinutes: number): string {
  const mins = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** Local calendar date as "YYYY-MM-DD". */
export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** One day's effective hours (weekly hours, or a date override). */
export interface DaySchedule {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  breakStart?: string | null;
  breakEnd?: string | null;
}

/** The hours that actually apply on `date`: a date override when one exists,
 * otherwise that weekday's saved weekly hours (missing day = closed). */
export function scheduleFor(
  date: Date,
  weekly: BusinessHour[],
  overrides: DateHour[],
): DaySchedule {
  const key = isoDate(date);
  const override = overrides.find((o) => o.date.slice(0, 10) === key);
  if (override) {
    return { isOpen: override.isOpen, openTime: override.openTime, closeTime: override.closeTime };
  }
  const day = weekly.find((h) => h.dayOfWeek === date.getDay());
  return day ?? { isOpen: false, openTime: '00:00', closeTime: '00:00' };
}

export type OpenState = 'open' | 'closed' | 'break';

export interface OpenStatus {
  state: OpenState;
  /** "Closes at 8:00 PM" / "Back at 2:00 PM" / "Opens Monday at 10:00 AM". */
  detail: string;
  /** Today's effective hours. */
  today: DaySchedule;
}

/** Whether the business is open right now, and what happens next. */
export function computeStatus(now: Date, weekly: BusinessHour[], overrides: DateHour[]): OpenStatus {
  const today = scheduleFor(now, weekly, overrides);
  const nowMin = now.getHours() * 60 + now.getMinutes();

  if (today.isOpen && today.openTime < today.closeTime) {
    const open = toMinutes(today.openTime);
    const close = toMinutes(today.closeTime);
    if (nowMin < open) {
      return { state: 'closed', detail: `Opens today at ${fmt12(today.openTime)}`, today };
    }
    if (nowMin < close) {
      if (today.breakStart && today.breakEnd) {
        const bs = toMinutes(today.breakStart);
        const be = toMinutes(today.breakEnd);
        if (nowMin >= bs && nowMin < be) {
          return { state: 'break', detail: `Back at ${fmt12(today.breakEnd)}`, today };
        }
      }
      return { state: 'open', detail: `Closes at ${fmt12(today.closeTime)}`, today };
    }
  }

  // Closed for the rest of today — find the next day that opens.
  for (let i = 1; i <= 7; i += 1) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const s = scheduleFor(d, weekly, overrides);
    if (s.isOpen && s.openTime < s.closeTime) {
      const when = i === 1 ? 'tomorrow' : DAY_NAMES[d.getDay()];
      return { state: 'closed', detail: `Opens ${when} at ${fmt12(s.openTime)}`, today };
    }
  }
  return { state: 'closed', detail: 'No opening hours set', today };
}

/** True when the shared break window sits entirely inside this day's hours. */
export function breakFits(day: BusinessHour, breakStart: string, breakEnd: string): boolean {
  return (
    day.isOpen && breakStart < breakEnd && breakStart >= day.openTime && breakEnd <= day.closeTime
  );
}

/** Open minutes in one day, minus the shared break when it fits inside. */
export function openMinutes(
  day: BusinessHour,
  hasBreak: boolean,
  breakStart: string,
  breakEnd: string,
): number {
  if (!day.isOpen || day.closeTime <= day.openTime) return 0;
  let total = toMinutes(day.closeTime) - toMinutes(day.openTime);
  if (hasBreak && breakFits(day, breakStart, breakEnd)) {
    total -= toMinutes(breakEnd) - toMinutes(breakStart);
  }
  return total;
}

export interface WeekGroup {
  label: string; // "Mon–Sat" / "Sun"
  value: string; // "10:00 AM – 8:00 PM" / "Closed"
  isOpen: boolean;
}

/** Collapses consecutive days (Mon → Sun) with identical hours. */
export function groupWeek(days: BusinessHour[]): WeekGroup[] {
  const groups: { first: number; last: number; sig: string; day: BusinessHour }[] = [];
  WEEK_ORDER.forEach((dow) => {
    const day = days.find((d) => d.dayOfWeek === dow);
    if (!day) return;
    const sig = day.isOpen ? `${day.openTime}-${day.closeTime}` : 'closed';
    const prev = groups[groups.length - 1];
    if (prev && prev.sig === sig) prev.last = dow;
    else groups.push({ first: dow, last: dow, sig, day });
  });
  return groups.map((g) => ({
    label: g.first === g.last ? DAY_SHORT[g.first] : `${DAY_SHORT[g.first]}–${DAY_SHORT[g.last]}`,
    value: g.day.isOpen ? `${fmt12(g.day.openTime)} – ${fmt12(g.day.closeTime)}` : 'Closed',
    isOpen: g.day.isOpen,
  }));
}
