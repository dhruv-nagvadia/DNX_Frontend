import { useState, useCallback, useMemo } from 'react';

import { useSetBusinessHoursMutation } from '@/redux/api/provider/providerApi';
import { BusinessHour } from '@/redux/api/provider/types';
import { breakFits } from './hoursUtils';

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

/** Applies the one shared break to every open day it fits inside — a day whose
 * own hours are too short to contain it simply gets no break. This is exactly
 * what Save submits. */
function applyBreak(
  days: BusinessHour[],
  hasBreak: boolean,
  breakStart: string,
  breakEnd: string,
): BusinessHour[] {
  return days.map((d) =>
    hasBreak && breakFits(d, breakStart, breakEnd)
      ? { ...d, breakStart, breakEnd }
      : { ...d, breakStart: null, breakEnd: null },
  );
}

/** A comparable fingerprint of a full week as it would be stored (ids and
 * undefined-vs-null differences ignored). */
function fingerprint(days: BusinessHour[]): string {
  return JSON.stringify(
    days.map((d) => ({
      dayOfWeek: d.dayOfWeek,
      isOpen: d.isOpen,
      openTime: d.openTime,
      closeTime: d.closeTime,
      breakStart: d.breakStart || null,
      breakEnd: d.breakEnd || null,
    })),
  );
}

interface FormState {
  days: BusinessHour[];
  hasBreak: boolean;
  breakStart: string;
  breakEnd: string;
}

/** Turns a stored week into editable form state. The one shared break window is
 * pre-filled from whichever day already has one. */
function toForm(hours: BusinessHour[]): FormState {
  const days = normalize(hours);
  const existingBreak = days.find((h) => h.breakStart && h.breakEnd);
  return {
    days,
    hasBreak: !!existingBreak,
    breakStart: existingBreak?.breakStart ?? '13:00',
    breakEnd: existingBreak?.breakEnd ?? '14:00',
  };
}

export function useBusinessHours(providerId: string, initial: BusinessHour[]) {
  const [setBusinessHours, { isLoading: saving }] = useSetBusinessHoursMutation();

  // What was last loaded or saved — Discard returns here and `dirty` compares
  // against it.
  const [baseline, setBaseline] = useState<BusinessHour[]>(() => normalize(initial));
  const [form, setForm] = useState<FormState>(() => toForm(initial));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { days, hasBreak, breakStart, breakEnd } = form;

  // Compare the actual payload Save would send (break applied per day) with
  // what's stored, so a break-only change also counts as unsaved.
  const payload = useMemo(
    () => applyBreak(days, hasBreak, breakStart, breakEnd),
    [days, hasBreak, breakStart, breakEnd],
  );
  const dirty = useMemo(
    () => fingerprint(payload) !== fingerprint(baseline),
    [payload, baseline],
  );

  const edit = useCallback((fn: (prev: FormState) => FormState) => {
    setSaved(false);
    setError(null);
    setForm(fn);
  }, []);

  const toggleDay = useCallback(
    (dayOfWeek: number) =>
      edit((prev) => ({
        ...prev,
        days: prev.days.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, isOpen: !d.isOpen } : d)),
      })),
    [edit],
  );

  const setTime = useCallback(
    (dayOfWeek: number, field: 'openTime' | 'closeTime', value: string) =>
      edit((prev) => ({
        ...prev,
        days: prev.days.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, [field]: value } : d)),
      })),
    [edit],
  );

  /** Copies Monday's open flag + times to every other day (form only). */
  const copyMondayToAll = useCallback(
    () =>
      edit((prev) => {
        const monday = prev.days.find((d) => d.dayOfWeek === 1);
        if (!monday) return prev;
        return {
          ...prev,
          days: prev.days.map((d) =>
            d.dayOfWeek === 1
              ? d
              : { ...d, isOpen: monday.isOpen, openTime: monday.openTime, closeTime: monday.closeTime },
          ),
        };
      }),
    [edit],
  );

  // Turns the shared break on (keeping its last window) or off entirely.
  const toggleBreak = useCallback(
    () => edit((prev) => ({ ...prev, hasBreak: !prev.hasBreak })),
    [edit],
  );

  const setBreakTime = useCallback(
    (field: 'breakStart' | 'breakEnd', value: string) =>
      edit((prev) => ({ ...prev, [field]: value })),
    [edit],
  );

  /** Throws away every unsaved edit. */
  const discard = useCallback(() => {
    setError(null);
    setSaved(false);
    setForm(toForm(baseline));
  }, [baseline]);

  const save = useCallback(async () => {
    setError(null);
    // Guard: for open days, close must be after open.
    const badHours = days.find((d) => d.isOpen && d.closeTime <= d.openTime);
    if (badHours) {
      setError('Closing time must be after opening time.');
      return;
    }
    if (hasBreak && breakStart >= breakEnd) {
      setError('Break end must be after break start.');
      return;
    }

    try {
      await setBusinessHours({ id: providerId, hours: payload }).unwrap();
      setBaseline(payload);
      setForm((prev) => ({ ...prev, days: payload }));
      setSaved(true);
    } catch {
      setError('Could not save business hours. Please try again.');
    }
  }, [days, providerId, setBusinessHours, hasBreak, breakStart, breakEnd, payload]);

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
    copyMondayToAll,
    toggleBreak,
    setBreakTime,
    discard,
    save,
  };
}
