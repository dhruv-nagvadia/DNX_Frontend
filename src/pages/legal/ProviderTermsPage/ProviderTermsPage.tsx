import { PROVIDER_TERMS_LAST_UPDATED, PROVIDER_TERMS_SECTIONS } from '@/utils/legalContent';

import { LegalLayout } from '../LegalLayout';

/** Public Provider Terms — no auth required, linked from provider signup. */
export default function ProviderTermsPage() {
  return (
    <LegalLayout
      title="Provider Terms"
      lastUpdated={PROVIDER_TERMS_LAST_UPDATED}
      sections={PROVIDER_TERMS_SECTIONS}
    />
  );
}
