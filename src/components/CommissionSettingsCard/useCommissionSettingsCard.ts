import { useEffect, useState } from 'react';
import {
  useGetPlatformConfigQuery,
  useUpdatePlatformConfigMutation,
} from '@/redux/api/admin/adminApi';
import {
  bpsToPercentText,
  minorToRupeesText,
  percentTextToBps,
  rupeesTextToMinor,
} from '@/utils/money';

// Mirrors the server's guards: a typo like "100" must not charge providers everything.
const MAX_COMMISSION_PERCENT = 50;
const MAX_GATEWAY_PERCENT = 10;

/** Edits the platform commission and the (estimated) payment-gateway fee. */
export function useCommissionSettingsCard() {
  const { data: config, isLoading } = useGetPlatformConfigQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [updateConfig, { isLoading: saving }] = useUpdatePlatformConfigMutation();

  const [commission, setCommission] = useState('10');
  const [feePercent, setFeePercent] = useState('0');
  const [feeFlat, setFeeFlat] = useState('0');
  const [feeAbove, setFeeAbove] = useState('0');
  const [feeCap, setFeeCap] = useState('0');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!config) return;
    setCommission(bpsToPercentText(config.commissionBps));
    setFeePercent(bpsToPercentText(config.gatewayFeeBps));
    setFeeFlat(minorToRupeesText(config.gatewayFeeFlatMinor));
    setFeeAbove(minorToRupeesText(config.gatewayFeeAboveMinor));
    setFeeCap(minorToRupeesText(config.gatewayFeeCapMinor));
  }, [config]);

  /** Wraps a setter so editing clears the "saved" / error banners. */
  const field = (set: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    set(e.target.value);
    setSaved(false);
    setError(null);
  };

  const commissionBps = percentTextToBps(commission, MAX_COMMISSION_PERCENT);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const gatewayFeeBps = percentTextToBps(feePercent, MAX_GATEWAY_PERCENT);
    const gatewayFeeFlatMinor = rupeesTextToMinor(feeFlat);
    const gatewayFeeAboveMinor = rupeesTextToMinor(feeAbove);
    const gatewayFeeCapMinor = rupeesTextToMinor(feeCap);

    if (commissionBps === null) {
      setError(`Commission must be between 0 and ${MAX_COMMISSION_PERCENT}%.`);
      return;
    }
    if (
      gatewayFeeBps === null ||
      gatewayFeeFlatMinor === null ||
      gatewayFeeAboveMinor === null ||
      gatewayFeeCapMinor === null
    ) {
      setError(
        `Gateway fee % must be between 0 and ${MAX_GATEWAY_PERCENT}, and amounts can't be negative.`,
      );
      return;
    }

    try {
      await updateConfig({
        commissionBps,
        gatewayFeeBps,
        gatewayFeeFlatMinor,
        gatewayFeeAboveMinor,
        gatewayFeeCapMinor,
      }).unwrap();
      setError(null);
      setSaved(true);
    } catch {
      setError("Couldn't save the settings. Please try again.");
    }
  };

  return {
    isLoading,
    saving,
    saved,
    error,
    submit,
    commission,
    feePercent,
    feeFlat,
    feeAbove,
    feeCap,
    onCommission: field(setCommission),
    onFeePercent: field(setFeePercent),
    onFeeFlat: field(setFeeFlat),
    onFeeAbove: field(setFeeAbove),
    onFeeCap: field(setFeeCap),
    // Live example so the admin sees exactly what a rate means.
    previewCommissionMinor:
      commissionBps === null ? null : Math.round((100000 * commissionBps) / 10000),
  };
}
