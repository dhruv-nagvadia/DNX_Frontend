import { CreditCard, Percent, Settings2 } from 'lucide-react';

import { AlertBanner } from '@/components/AlertBanner';
import { Button } from '@/components/Button';
import { ModernCard } from '@/components/ModernCard';
import { Skeleton } from '@/components/Skeleton';
import { formatMoney } from '@/utils/money';
import { useCommissionSettingsCard } from './useCommissionSettingsCard';
import styles from '@/components/FinanceTable/FinanceTable.module.css';

const EXAMPLE_SALE_MINOR = 100000; // ₹1,000

/** The platform's cut of every sale, plus the payment-gateway fee it estimates for the profit view. */
export function CommissionSettingsCard() {
  const s = useCommissionSettingsCard();

  if (s.isLoading) {
    return (
      <div className={styles.section}>
        <ModernCard icon={<Settings2 size={20} aria-hidden="true" />} title="Commission">
          <Skeleton height={160} radius="var(--m-radius-box)" />
        </ModernCard>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <ModernCard icon={<Settings2 size={20} aria-hidden="true" />} title="Commission">
        <p className={styles.cardIntro}>
          Two separate settings: what the platform actually charges, and an estimate used only for
          your own profit figure.
        </p>
        <form className={styles.form} onSubmit={s.submit}>
          <div className={styles.formBlock}>
            <div className={styles.blockHead}>
              <span className={`${styles.blockIcon} ${styles.blockIconBlue}`} aria-hidden="true">
                <Percent size={18} />
              </span>
              <div>
                <h3 className={styles.blockTitle}>Platform commission</h3>
                <p className={styles.blockDesc}>
                  The share of each completed booking or order that the platform keeps. Providers
                  get the rest — customers always pay the listed price.
                </p>
              </div>
            </div>
            <div className={styles.blockFields}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="commission">
                  Commission (%)
                </label>
                <div className={styles.inputAffix}>
                  <input
                    id="commission"
                    type="number"
                    min="0"
                    max="50"
                    step="any"
                    inputMode="decimal"
                    value={s.commission}
                    onChange={s.onCommission}
                  />
                  <span className={styles.affix} aria-hidden="true">
                    %
                  </span>
                </div>
              </div>
              {s.previewCommissionMinor !== null && (
                <p className={styles.infoBox}>
                  <span>
                    On a <strong>{formatMoney(EXAMPLE_SALE_MINOR)}</strong> sale you keep{' '}
                    <strong>{formatMoney(s.previewCommissionMinor)}</strong> and the provider earns{' '}
                    <strong>{formatMoney(EXAMPLE_SALE_MINOR - s.previewCommissionMinor)}</strong>. A
                    change applies to new bookings and orders only — existing ones keep the rate
                    they were made with. Set a different rate for one business under “Rates per
                    business”.
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className={styles.formBlock}>
            <div className={styles.blockHead}>
              <span className={`${styles.blockIcon} ${styles.blockIconPeach}`} aria-hidden="true">
                <CreditCard size={18} />
              </span>
              <div>
                <h3 className={styles.blockTitle}>Payment-gateway fee</h3>
                <p className={styles.blockDesc}>
                  An estimate only — it's never added to what customers pay. It just reduces the
                  profit figure shown to you, so it matches what your real gateway actually
                  deducts.
                </p>
              </div>
            </div>
            <div className={styles.blockFields}>
              <div className={styles.grid2}>
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
              <p className={styles.hint}>
                Leave everything at 0 to ignore gateway fees. Example for the UPI merchant fee:
                0.4%, only above ₹2,000, max ₹300. Check your gateway's pricing for the real
                numbers.
              </p>
            </div>
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
      </ModernCard>
    </div>
  );
}
