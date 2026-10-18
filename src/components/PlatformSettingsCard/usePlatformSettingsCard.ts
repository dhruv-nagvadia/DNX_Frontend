import { useEffect, useState } from 'react';
import {
  useGetPlatformConfigQuery,
  useUpdatePlatformConfigMutation,
} from '@/redux/api/admin/adminApi';

/** The one platform-wide setting admins can tune today: how long a customer
 * has to collect a ready pickup order before a provider can mark it a no-show. */
export function usePlatformSettingsCard() {
  const { data: config, isLoading } = useGetPlatformConfigQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [updateConfig, { isLoading: saving }] = useUpdatePlatformConfigMutation();

  const [hours, setHours] = useState('24');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (config) setHours(String(config.orderPickupWindowHours));
  }, [config]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHours(e.target.value);
    setSaved(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(hours);
    if (!Number.isFinite(value) || value <= 0) return;
    await updateConfig({ orderPickupWindowHours: Math.round(value) }).unwrap();
    setSaved(true);
  };

  return { hours, onChange, submit, isLoading, saving, saved };
}
