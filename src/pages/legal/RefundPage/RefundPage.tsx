import { REFUND_LAST_UPDATED, REFUND_POLICY_SECTIONS } from '@/utils/legalContent';

import { LegalLayout } from '../LegalLayout';

/** Public Refund & Cancellation Policy — no auth required, linked from signup and the mobile app. */
export default function RefundPage() {
  return (
    <LegalLayout
      title="Refund & Cancellation Policy"
      lastUpdated={REFUND_LAST_UPDATED}
      sections={REFUND_POLICY_SECTIONS}
    />
  );
}
