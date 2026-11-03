import { useEffect, useMemo, useState } from 'react';

import {
  useDeleteDateHourMutation,
  useGetBusinessBookingsQuery,
  useGetDateHoursQuery,
  useGetMyOrdersQuery,
  useSetDateHourMutation,
} from '@/redux/api/provider/providerApi';
import { BookingStatus, BusinessHour, BusinessType, OrderStatus } from '@/redux/api/provider/types';

export type CalendarView = 'month' | 'week';

export interface EffectiveHours {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  source: 'override' | 'weekly' | 'none';
}

export type ItemStatus = BookingStatus | OrderStatus;

/** A booking or an order, normalized to one shape the calendar UI can render
 * without caring which it is — a store's calendar shows orders (by
 * `createdAt`, no duration), a service's shows bookings (by `startTime`,
 * with a real end time). */
export interface CalendarItem {
  id: string;
  time: string;
  endTime?: string;
  title: string;
  /** Service name, or "First item +N more" for an order. */
  subtitle: string;
  amountMinor: number;
  status: ItemStatus;
}

/** Status dots shown on a calendar cell. */
export type DotTone = 'pending' | 'confirmed' | 'completed';

export interface CalendarDay {
  date: Date;
  key: string; // YYYY-MM-DD
  inMonth: boolean;
  isToday: boolean;
  hours: EffectiveHours;
  /** Every item that day, cancelled ones included (the day panel lists them). */
  items: CalendarItem[];
  /** Non-cancelled items. */
  count: number;
  /** Sum of amountMinor over non-cancelled items. */
  earningsMinor: number;
  pendingCount: number;
  dots: DotTone[];
  /** Closed by the weekly schedule, or by a date override. */
  closedBy: 'weekly' | 'override' | null;
  /** Open with overridden hours. */
  customHours: boolean;
}

export interface MonthStats {
  count: number;
  busiest: { date: Date; count: number } | null;
  closedDays: number;
  customDays: number;
}

export const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromKey = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const startOfWeek = (d: Date) => addDays(startOfDay(d), -startOfDay(d).getDay()); // Sunday
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);

const DOT_ORDER: DotTone[] = ['pending', 'confirmed', 'completed'];
function dotFor(status: ItemStatus): DotTone | null {
  if (status === 'PENDING') return 'pending';
  if (status === 'CONFIRMED' || status === 'READY') return 'confirmed';
  if (status === 'COMPLETED') return 'completed';
  return null;
}

/** Calendar state: month/week navigation, bookings/orders, and per-date hour overrides. */
export function useBusinessCalendar(
  providerId: string,
  weeklyHours: BusinessHour[],
  businessType: BusinessType = 'SERVICE',
) {
  const isStore = businessType === 'STORE';
  const [view, setView] = useState<CalendarView>('month');
  const [cursor, setCursor] = useState(() => startOfDay(new Date()));
  const [selectedKey, setSelectedKey] = useState(() => ymd(new Date()));

  // The overrides fetch always spans the cursor month's 6-week grid: the
  // month tiles need it, and the cursor's week is always inside it.
  const gridStart = useMemo(
    () => startOfWeek(new Date(cursor.getFullYear(), cursor.getMonth(), 1)),
    [cursor],
  );
  const gridEnd = useMemo(() => addDays(gridStart, 41), [gridStart]);

  const { data: bookings = [] } = useGetBusinessBookingsQuery(providerId, { skip: isStore });
  const { data: orders = [] } = useGetMyOrdersQuery(undefined, { skip: !isStore });
  const { data: overrides = [] } = useGetDateHoursQuery({
    id: providerId,
    from: ymd(gridStart),
    to: ymd(gridEnd),
  });

  const weeklyByDay = useMemo(() => {
    const m = new Map<number, BusinessHour>();
    weeklyHours.forEach((h) => m.set(h.dayOfWeek, h));
    return m;
  }, [weeklyHours]);

  const overrideByKey = useMemo(() => {
    const m = new Map<string, { isOpen: boolean; openTime: string; closeTime: string }>();
    overrides.forEach((o) =>
      m.set(o.date.slice(0, 10), {
        isOpen: o.isOpen,
        openTime: o.openTime,
        closeTime: o.closeTime,
      }),
    );
    return m;
  }, [overrides]);

  const itemsByKey = useMemo(() => {
    const m = new Map<string, CalendarItem[]>();
    const push = (k: string, item: CalendarItem) => {
      const arr = m.get(k) ?? [];
      arr.push(item);
      m.set(k, arr);
    };

    if (isStore) {
      orders
        .filter((o) => o.provider.id === providerId)
        .forEach((o) => {
          const first = o.items[0]?.name ?? 'Order';
          const more = o.items.length > 1 ? ` +${o.items.length - 1} more` : '';
          push(ymd(new Date(o.createdAt)), {
            id: o.id,
            time: o.createdAt,
            title: o.user.fullName,
            subtitle: `${first}${more}`,
            amountMinor: o.amountMinor,
            status: o.status,
          });
        });
    } else {
      bookings.forEach((b) => {
        push(ymd(new Date(b.startTime)), {
          id: b.id,
          time: b.startTime,
          endTime: b.endTime,
          title: b.user.fullName,
          subtitle: b.service.name,
          amountMinor: b.amountMinor,
          status: b.status,
        });
      });
    }

    m.forEach((arr) => arr.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()));
    return m;
  }, [isStore, orders, bookings, providerId]);

  const todayKey = ymd(new Date());

  const dayFor = useMemo(() => {
    const effective = (key: string, dow: number): EffectiveHours => {
      const o = overrideByKey.get(key);
      if (o) return { ...o, source: 'override' };
      const w = weeklyByDay.get(dow);
      if (w) return { isOpen: w.isOpen, openTime: w.openTime, closeTime: w.closeTime, source: 'weekly' };
      return { isOpen: false, openTime: '09:00', closeTime: '18:00', source: 'none' };
    };
    return (date: Date, inMonth: boolean): CalendarDay => {
      const key = ymd(date);
      const hours = effective(key, date.getDay());
      const items = itemsByKey.get(key) ?? [];
      const active = items.filter((i) => i.status !== 'CANCELLED');
      const dotSet = new Set(active.map((i) => dotFor(i.status)));
      return {
        date,
        key,
        inMonth,
        isToday: key === todayKey,
        hours,
        items,
        count: active.length,
        earningsMinor: active.reduce((sum, i) => sum + i.amountMinor, 0),
        pendingCount: active.filter((i) => i.status === 'PENDING').length,
        dots: DOT_ORDER.filter((t) => dotSet.has(t)),
        closedBy: hours.isOpen ? null : hours.source === 'override' ? 'override' : 'weekly',
        customHours: hours.isOpen && hours.source === 'override',
      };
    };
  }, [overrideByKey, weeklyByDay, itemsByKey, todayKey]);

  const monthWeeks = useMemo<CalendarDay[][]>(() => {
    const weeks: CalendarDay[][] = [];
    for (let w = 0; w < 6; w++) {
      const row: CalendarDay[] = [];
      for (let d = 0; d < 7; d++) {
        const date = addDays(gridStart, w * 7 + d);
        row.push(dayFor(date, date.getMonth() === cursor.getMonth()));
      }
      weeks.push(row);
    }
    return weeks;
  }, [gridStart, cursor, dayFor]);

  const weekDays = useMemo<CalendarDay[]>(() => {
    const start = startOfWeek(cursor);
    return Array.from({ length: 7 }, (_, i) => dayFor(addDays(start, i), true));
  }, [cursor, dayFor]);

  /** Tiles: always for the cursor's month, whichever view is showing. */
  const monthStats = useMemo<MonthStats>(() => {
    const days = monthWeeks.flat().filter((d) => d.inMonth);
    let busiest: MonthStats['busiest'] = null;
    for (const d of days) {
      if (d.count > 0 && (!busiest || d.count > busiest.count)) busiest = { date: d.date, count: d.count };
    }
    return {
      count: days.reduce((s, d) => s + d.count, 0),
      busiest,
      closedDays: days.filter((d) => d.closedBy).length,
      customDays: days.filter((d) => d.customHours).length,
    };
  }, [monthWeeks]);

  const label = useMemo(() => {
    if (view === 'week') {
      const s = startOfWeek(cursor);
      const e = addDays(s, 6);
      const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
      return `${s.toLocaleDateString(undefined, opts)} – ${e.toLocaleDateString(undefined, opts)}, ${e.getFullYear()}`;
    }
    return cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }, [view, cursor]);

  const prev = () => setCursor((c) => (view === 'week' ? addDays(c, -7) : addMonths(c, -1)));
  const next = () => setCursor((c) => (view === 'week' ? addDays(c, 7) : addMonths(c, 1)));
  const today = () => {
    const t = startOfDay(new Date());
    setCursor(t);
    setSelectedKey(ymd(t));
  };
  /** Select a date; the cursor follows it, so picking a greyed day from the
   * previous/next month navigates there. */
  const selectDay = (key: string) => {
    setSelectedKey(key);
    setCursor(fromKey(key));
  };

  const selectedDay = useMemo(() => dayFor(fromKey(selectedKey), true), [selectedKey, dayFor]);

  const hasOverride = overrideByKey.has(selectedKey);

  // Per-date override editor form, synced to the selected day's effective hours.
  const [form, setForm] = useState({ isOpen: true, openTime: '09:00', closeTime: '18:00' });
  useEffect(() => {
    setForm({
      isOpen: selectedDay.hours.isOpen,
      openTime: selectedDay.hours.openTime,
      closeTime: selectedDay.hours.closeTime,
    });
  }, [selectedKey, selectedDay.hours.isOpen, selectedDay.hours.openTime, selectedDay.hours.closeTime]);

  const dirty =
    form.isOpen !== selectedDay.hours.isOpen ||
    (form.isOpen &&
      (form.openTime !== selectedDay.hours.openTime || form.closeTime !== selectedDay.hours.closeTime));

  const [setDateHour, { isLoading: saving }] = useSetDateHourMutation();
  const [deleteDateHour, { isLoading: removing }] = useDeleteDateHourMutation();
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setError(null), [selectedKey]);

  const saveOverride = async () => {
    setError(null);
    try {
      await setDateHour({ id: providerId, data: { date: selectedKey, ...form } }).unwrap();
    } catch {
      setError('Couldn’t save the hours for this date. Please try again.');
    }
  };
  const resetOverride = async () => {
    setError(null);
    try {
      await deleteDateHour({ id: providerId, date: selectedKey }).unwrap();
    } catch {
      setError('Couldn’t reset this date. Please try again.');
    }
  };

  return {
    view,
    setView,
    label,
    itemLabel: isStore ? ('order' as const) : ('booking' as const),
    prev,
    next,
    today,
    monthWeeks,
    weekDays,
    monthStats,
    selectedKey,
    selectDay,
    selectedDay,
    hasOverride,
    form,
    setForm,
    dirty,
    saveOverride,
    resetOverride,
    saving,
    removing,
    error,
  };
}
