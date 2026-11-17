import { Clock, Settings2 } from 'lucide-react';

import { AlertBanner } from '@/components/AlertBanner';
import { Button } from '@/components/Button';
import { ModernCard } from '@/components/ModernCard';
import { usePlatformSettingsCard } from './usePlatformSettingsCard';
import ui from './PlatformSettingsCard.module.css';

/** Platform-wide settings an admin can tune — currently just the pickup window. */
export function PlatformSettingsCard() {
  const { hours, onChange, submit, isLoading, saving, saved } = usePlatformSettingsCard();

  if (isLoading) return null;

  return (
    <ModernCard
      icon={<Settings2 size={20} aria-hidden="true" />}
      title="Platform settings"
      suffix="Applies to every business"
    >
      <form className={ui.setting} onSubmit={submit}>
        <span className={ui.settingIcon} aria-hidden="true">
          <Clock size={18} />
        </span>
        <div className={ui.settingText}>
          <label className={ui.settingLabel} htmlFor="pickupWindowHours">
            Pickup window
          </label>
          <p className={ui.settingHint} id="pickupWindowHint">
            How long a customer has to collect a ready order before a provider can mark it a no-show.
          </p>
        </div>
        <div className={ui.controls}>
          <div className={ui.affix}>
            <input
              id="pickupWindowHours"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={hours}
              onChange={onChange}
              aria-describedby="pickupWindowHint"
            />
            <span className={ui.suffix}>hours</span>
          </div>
          <Button type="submit" loading={saving} loadingText="Saving…">
            Save
          </Button>
        </div>
      </form>
      {saved && (
        <AlertBanner tone="success" className={ui.saved}>
          Saved — applies to every business.
        </AlertBanner>
      )}
    </ModernCard>
  );
}
