import { useEffect, useMemo, useState } from 'react';

import {
  useDeleteDateHourMutation,
  useGetBusinessBookingsQuery,
  useGetDateHoursQuery,
  useGetMyOrdersQuery,
  useSetDateHourMutation,
} from '@/redux/api/provider/providerApi';
import { BusinessHour, BusinessType } from '@/redux/api/provider/types';

export type CalendarView = 'month' | 'week';

export interface EffectiveHours {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  source: 'override' | 'weekly' | 'none';
}

/** A booking or an order, normalized to one shape the calendar UI can render
 * without caring which it is — a store's calendar shows orders (by
 * `createdAt`, no duration), a service's shows bookings (by `startTime`,
 * with a real end time). */
export interface CalendarItem {
  id: string;
  time: string;
  endTime?: string;
  title: string;
  subtitle: string;
}

export interface CalendarDay {
  date: Date;
  key: string; // YYYY-MM-DD
  inMonth: boolean;
  isToday: boolean;
  hours: EffectiveHours;
  items: CalendarItem[];
}

export const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
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

  // Visible date range (grid extent) drives the overrides fetch.
  const gridStart = useMemo(
    () =>
      view === 'week'
        ? startOfWeek(cursor)
        : startOfWeek(new Date(cursor.getFullYear(), cursor.getMonth(), 1)),
    [view, cursor],
  );
  const gridEnd = useMemo(() => addDays(gridStart, view === 'week' ? 6 : 41), [gridStart, view]);

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
        .filter((o) => o.provider.id === providerId && o.status !== 'CANCELLED')
        .forEach((o) => {
          push(ymd(new Date(o.createdAt)), {
            id: o.id,
            time: o.createdAt,
            title: o.user.fullName,
            subtitle: `${o.items.length} item${o.items.length === 1 ? '' : 's'}`,
          });
        });
    } else {
      bookings
        .filter((b) => b.status !== 'CANCELLED')
        .forEach((b) => {
          push(ymd(new Date(b.startTime)), {
            id: b.id,
            time: b.startTime,
            endTime: b.endTime,
            title: b.user.fullName,
            subtitle: b.service.name,
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
      return {
        date,
        key,
        inMonth,
        isToday: key === todayKey,
        hours: effective(key, date.getDay()),
        items: itemsByKey.get(key) ?? [],
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

  const selectedDay = useMemo(() => {
    const [y, m, d] = selectedKey.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return dayFor(date, true);
  }, [selectedKey, dayFor]);

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

  const [setDateHour, { isLoading: saving }] = useSetDateHourMutation();
  const [deleteDateHour, { isLoading: removing }] = useDeleteDateHourMutation();

  const saveOverride = async () => {
    try {
      await setDateHour({ id: providerId, data: { date: selectedKey, ...form } }).unwrap();
    } catch {
      // surfaced via mutation state
    }
  };
  const resetOverride = async () => {
    try {
      await deleteDateHour({ id: providerId, date: selectedKey }).unwrap();
    } catch {
      // ignore
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
    selectedKey,
    selectDay: setSelectedKey,
    selectedDay,
    hasOverride,
    form,
    setForm,
    saveOverride,
    resetOverride,
    saving,
    removing,
  };
}
