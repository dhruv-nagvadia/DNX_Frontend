import { useState, useCallback, useRef } from 'react';

import { useSetBusinessHoursMutation } from '@/redux/api/provider/providerApi';
import { BusinessHour } from '@/redux/api/provider/types';

/** Fills in any missing days with sensible defaults (Mon–Sat open, Sun closed). */
function normalize(hours: BusinessHour[]): BusinessHour[] {
  return Array.from({ length: 7 }, (_, day) => {
    const existing = hours.find((h) => h.dayOfWeek === day);
    return (
      existing ?? {
        dayOfWeek: day,
        isOpen: day !== 0, // Sunday closed by default
        openTime: '09:00',
        closeTime: '18:00',
      }
    );
  });
}

/** A comparable fingerprint of everything Save would submit — used to tell
 * whether there's actually anything unsaved. */
function snapshot(days: BusinessHour[], hasBreak: boolean, breakStart: string, breakEnd: string) {
  return JSON.stringify({ days, break: hasBreak ? [breakStart, breakEnd] : null });
}

export function useBusinessHours(providerId: string, initial: BusinessHour[]) {
  const [setBusinessHours, { isLoading: saving }] = useSetBusinessHoursMutation();
  const [days, setDays] = useState<BusinessHour[]>(() => normalize(initial));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // One shared break window for every day, not set per day — pre-filled from
  // whichever day already had one (from before this was a shared setting).
  const existingBreak = initial.find((h) => h.breakStart && h.breakEnd);
  const [hasBreak, setHasBreak] = useState(!!existingBreak);
  const [breakStart, setBreakStart] = useState(existingBreak?.breakStart ?? '13:00');
  const [breakEnd, setBreakEnd] = useState(existingBreak?.breakEnd ?? '14:00');

  // What was last saved (or loaded) — Save stays disabled until something
  // actually differs from this.
  const baseline = useRef(snapshot(days, hasBreak, breakStart, breakEnd));
  const dirty = snapshot(days, hasBreak, breakStart, breakEnd) !== baseline.current;

  const toggleDay = useCallback((dayOfWeek: number) => {
    setSaved(false);
    setDays((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, isOpen: !d.isOpen } : d)),
    );
  }, []);

  const setTime = useCallback(
    (dayOfWeek: number, field: 'openTime' | 'closeTime', value: string) => {
      setSaved(false);
      setDays((prev) =>
        prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, [field]: value } : d)),
      );
    },
    [],
  );

  // Turns the shared break on (with a default lunch window) or off entirely.
  const toggleBreak = useCallback(() => {
    setSaved(false);
    setHasBreak((prev) => !prev);
  }, []);

  const setBreakTime = useCallback((field: 'breakStart' | 'breakEnd', value: string) => {
    setSaved(false);
    if (field === 'breakStart') setBreakStart(value);
    else setBreakEnd(value);
  }, []);

  const save = useCallback(async () => {
    setError(null);
    // Guard: for open days, close must be after open.
    const badHours = days.find((d) => d.isOpen && d.closeTime <= d.openTime);
    if (badHours) {
      setError('Closing time must be after opening time.');
      return;
    }
    if (hasBreak && breakStart >= breakEnd) {
      setError('Break start must be before break end.');
      return;
    }

    // Apply the one shared break to every open day — except a day whose own
    // hours are too short to contain it, which simply gets no break rather
    // than failing the whole save.
    const withBreak = days.map((d) =>
      hasBreak && d.isOpen && breakStart >= d.openTime && breakEnd <= d.closeTime
        ? { ...d, breakStart, breakEnd }
        : { ...d, breakStart: null, breakEnd: null },
    );

    try {
      await setBusinessHours({ id: providerId, hours: withBreak }).unwrap();
      setDays(withBreak);
      baseline.current = snapshot(withBreak, hasBreak, breakStart, breakEnd);
      setSaved(true);
    } catch {
      setError('Could not save business hours. Please try again.');
    }
  }, [days, providerId, setBusinessHours, hasBreak, breakStart, breakEnd]);

  return {
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
  };
}
