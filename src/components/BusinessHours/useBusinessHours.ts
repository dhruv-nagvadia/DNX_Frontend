import { useState, useCallback } from 'react';

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

export function useBusinessHours(providerId: string, initial: BusinessHour[]) {
  const [setBusinessHours, { isLoading: saving }] = useSetBusinessHoursMutation();
  const [days, setDays] = useState<BusinessHour[]>(() => normalize(initial));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const save = useCallback(async () => {
    setError(null);
    // Guard: for open days, close must be after open.
    const invalid = days.find((d) => d.isOpen && d.closeTime <= d.openTime);
    if (invalid) {
      setError('Closing time must be after opening time.');
      return;
    }
    try {
      await setBusinessHours({ id: providerId, hours: days }).unwrap();
      setSaved(true);
    } catch {
      setError('Could not save business hours. Please try again.');
    }
  }, [days, providerId, setBusinessHours]);

  return { days, saving, saved, error, toggleDay, setTime, save };
}
