import { LEGAL_LAST_UPDATED, PRIVACY_POLICY_SECTIONS } from '@/utils/legalContent';

import { LegalLayout } from '../LegalLayout';

/** Public Privacy Policy — no auth required, linked from signup and the mobile app. */
export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      lastUpdated={LEGAL_LAST_UPDATED}
      sections={PRIVACY_POLICY_SECTIONS}
    />
  );
}
