import { AlertBanner } from '@/components/AlertBanner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Skeleton } from '@/components/Skeleton';
import { formatMoney } from '@/utils/money';
import { useCommissionSettingsCard } from './useCommissionSettingsCard';
// Generic field/label/form styling shared across provider/admin forms.
import styles from '@/components/ServicesManager/ServicesManager.module.css';
import local from '@/components/FinanceTable/FinanceTable.module.css';

const EXAMPLE_SALE_MINOR = 100000; // ₹1,000

/** The platform's cut of every sale, plus the payment-gateway fee it estimates for the profit view. */
export function CommissionSettingsCard() {
  const s = useCommissionSettingsCard();

  if (s.isLoading) {
    return (
      <Card title="Commission">
        <Skeleton height={120} radius="var(--radius-md)" />
      </Card>
    );
  }

  return (
    <Card
      title="Commission"
      subtitle="The share of each completed booking or order that the platform keeps. Providers get the rest. Customers always pay the listed price."
    >
      <form className={local.stack} onSubmit={s.submit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="commission">
            Platform commission (%)
          </label>
          <input
            id="commission"
            className={styles.input}
            type="number"
            min="0"
            max="50"
            step="any"
            inputMode="decimal"
            value={s.commission}
            onChange={s.onCommission}
          />
          {s.previewCommissionMinor !== null && (
            <p className={local.hint}>
              On a {formatMoney(EXAMPLE_SALE_MINOR)} sale you keep{' '}
              {formatMoney(s.previewCommissionMinor)} and the provider earns{' '}
              {formatMoney(EXAMPLE_SALE_MINOR - s.previewCommissionMinor)}. A change applies to new
              bookings and orders only — existing ones keep the rate they were made with. Set a
              different rate for one business under “Rates per business”.
            </p>
          )}
        </div>

        <div className={styles.field}>
          <span className={styles.label}>
            Payment-gateway fee{' '}
            <span className={styles.optional}>(estimate, only used for your profit figure)</span>
          </span>
          <div className={local.grid3}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="feePercent">
                Fee (%)
              </label>
              <input
                id="feePercent"
                className={styles.input}
                type="number"
                min="0"
                max="10"
                step="any"
                inputMode="decimal"
                value={s.feePercent}
                onChange={s.onFeePercent}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="feeFlat">
                Plus flat (₹)
              </label>
              <input
                id="feeFlat"
                className={styles.input}
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={s.feeFlat}
                onChange={s.onFeeFlat}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="feeAbove">
                Only above (₹)
              </label>
              <input
                id="feeAbove"
                className={styles.input}
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={s.feeAbove}
                onChange={s.onFeeAbove}
              />
            </div>
          </div>
          <div className={local.grid3}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="feeCap">
                Max per payment (₹)
              </label>
              <input
                id="feeCap"
                className={styles.input}
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={s.feeCap}
                onChange={s.onFeeCap}
              />
            </div>
          </div>
          <p className={local.hint}>
            Leave everything at 0 to ignore gateway fees. Example for the UPI merchant fee: 0.4% ,
            only above ₹2,000, max ₹300. The fee is never added to what customers pay — it just
            reduces your profit figure. Check your gateway’s pricing for the real numbers.
          </p>
        </div>

        {s.error && <AlertBanner tone="error">{s.error}</AlertBanner>}
        {s.saved && (
          <AlertBanner tone="success">
            Saved — new bookings and orders use these settings.
          </AlertBanner>
        )}

        <div className={styles.formActions}>
          <Button type="submit" loading={s.saving} loadingText="Saving…">
            Save settings
          </Button>
        </div>
      </form>
    </Card>
  );
}
