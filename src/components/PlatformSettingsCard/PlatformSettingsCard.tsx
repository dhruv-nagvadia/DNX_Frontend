import { AlertBanner } from '@/components/AlertBanner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { usePlatformSettingsCard } from './usePlatformSettingsCard';
// Generic field/label styling shared across provider/admin forms.
import styles from '@/components/ServicesManager/ServicesManager.module.css';

/** Platform-wide settings an admin can tune — currently just the pickup window. */
export function PlatformSettingsCard() {
  const { hours, onChange, submit, isLoading, saving, saved } = usePlatformSettingsCard();

  if (isLoading) return null;

  return (
    <Card
      title="Pickup window"
      subtitle="How long a customer has to collect a ready order before a provider can mark it a no-show."
    >
      <form className={styles.row2} onSubmit={submit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="pickupWindowHours">
            Hours
          </label>
          <input
            id="pickupWindowHours"
            className={styles.input}
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            value={hours}
            onChange={onChange}
          />
        </div>
        <div className={styles.field}>
          <Button type="submit" loading={saving} loadingText="Saving…">
            Save
          </Button>
        </div>
      </form>
      {saved && <AlertBanner tone="success">Saved — applies to every business.</AlertBanner>}
    </Card>
  );
}
