import { useState, useCallback } from 'react';

import {
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
} from '@/redux/api/provider/providerApi';
import { Service } from '@/redux/api/provider/types';
import { ServiceForm } from './types';

const EMPTY: ServiceForm = {
  name: '',
  description: '',
  price: '',
  hours: '0',
  minutes: '30',
  travelRequired: false,
  travelBaseFee: '',
  travelPerKm: '',
};

/** All state + handlers for adding, editing, and deleting a business's services. */
export function useServicesManager(providerId: string) {
  const [createService, { isLoading: creating }] = useCreateServiceMutation();
  const [updateService, { isLoading: updating }] = useUpdateServiceMutation();
  const [deleteService] = useDeleteServiceMutation();

  // null = not editing, 'new' = adding, otherwise the serviceId being edited.
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceForm>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  // Remembers the last on/off state the provider set for "On-location
  // service" so the next NEW service defaults to it too, instead of always
  // starting off — most providers add several services of the same kind in
  // a row (e.g. several travel services back to back).
  const travelDefaultKey = `dnx:lastTravelRequired:${providerId}`;
  const readTravelDefault = useCallback(() => {
    try {
      return localStorage.getItem(travelDefaultKey) === 'true';
    } catch {
      return false;
    }
  }, [travelDefaultKey]);

  const startAdd = useCallback(() => {
    setForm({ ...EMPTY, travelRequired: readTravelDefault() });
    setError(null);
    setEditing('new');
  }, [readTravelDefault]);

  const startEdit = useCallback((s: Service) => {
    setForm({
      name: s.name,
      description: s.description ?? '',
      price: String(s.priceMinor / 100),
      hours: String(Math.floor(s.durationMin / 60)),
      minutes: String(s.durationMin % 60),
      travelRequired: s.travelRequired ?? false,
      travelBaseFee: s.travelBaseFeeMinor ? String(s.travelBaseFeeMinor / 100) : '',
      travelPerKm: s.travelPerKmMinor ? String(s.travelPerKmMinor / 100) : '',
    });
    setError(null);
    setEditing(s.id);
  }, []);

  const cancel = useCallback(() => {
    setEditing(null);
    setError(null);
  }, []);

  /** Fills the name (and duration) from a picked suggestion. */
  const applySuggestion = useCallback((name: string, durationMin?: number) => {
    setForm((prev) => ({
      ...prev,
      name,
      ...(durationMin != null
        ? { hours: String(Math.floor(durationMin / 60)), minutes: String(durationMin % 60) }
        : {}),
    }));
  }, []);

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value }));
    },
    [],
  );

  const toggleTravelRequired = useCallback(() => {
    setForm((prev) => {
      const travelRequired = !prev.travelRequired;
      try {
        localStorage.setItem(travelDefaultKey, String(travelRequired));
      } catch {
        // Best-effort remembered default; ignore storage errors (private mode, quota, etc.)
      }
      return { ...prev, travelRequired };
    });
  }, [travelDefaultKey]);

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      const price = Number(form.price);
      const durationMin = Number(form.hours) * 60 + Number(form.minutes);
      if (form.name.trim().length < 2) return setError('Enter a service name');
      if (Number.isNaN(price) || price < 0) return setError('Enter a valid price');
      if (durationMin < 1) return setError('Select a duration (at least a few minutes)');

      const travelBaseFee = form.travelRequired ? Number(form.travelBaseFee) || 0 : 0;
      const travelPerKm = form.travelRequired ? Number(form.travelPerKm) || 0 : 0;
      if (form.travelRequired && (travelBaseFee < 0 || travelPerKm < 0)) {
        return setError('Enter valid travel fees');
      }

      const data = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price,
        durationMin,
        travelRequired: form.travelRequired,
        travelBaseFee,
        travelPerKm,
      };

      try {
        if (editing === 'new') {
          await createService({ providerId, data }).unwrap();
        } else if (editing) {
          await updateService({ providerId, serviceId: editing, data }).unwrap();
        }
        setEditing(null);
      } catch {
        setError('Could not save the service. Please try again.');
      }
    },
    [editing, form, providerId, createService, updateService],
  );

  const remove = useCallback(
    async (serviceId: string) => {
      if (!window.confirm('Delete this service?')) return;
      await deleteService({ providerId, serviceId })
        .unwrap()
        .catch(() => undefined);
    },
    [providerId, deleteService],
  );

  const toggleActive = useCallback(
    async (s: Service) => {
      await updateService({
        providerId,
        serviceId: s.id,
        data: { isActive: !(s.isActive ?? true) },
      })
        .unwrap()
        .catch(() => undefined);
    },
    [providerId, updateService],
  );

  return {
    editing,
    form,
    error,
    saving: creating || updating,
    startAdd,
    startEdit,
    cancel,
    onChange,
    toggleTravelRequired,
    applySuggestion,
    submit,
    remove,
    toggleActive,
  };
}
