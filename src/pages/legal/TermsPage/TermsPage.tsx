import { LEGAL_LAST_UPDATED, TERMS_SECTIONS } from '@/utils/legalContent';

import { LegalLayout } from '../LegalLayout';

/** Public Terms of Service — no auth required, linked from signup and the mobile app. */
export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      lastUpdated={LEGAL_LAST_UPDATED}
      sections={TERMS_SECTIONS}
    />
  );
}
