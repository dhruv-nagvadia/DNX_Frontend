import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

import card from './AuthCard.module.css';

interface AuthSubmitProps {
  loading: boolean;
  loadingText: string;
  children: ReactNode;
}

/** Full-width blue submit button with a spinner while loading. */
export function AuthSubmit({ loading, loadingText, children }: AuthSubmitProps) {
  return (
    <button type="submit" className={card.submit} disabled={loading} aria-busy={loading}>
      {loading ? (
        <>
          <Loader2 size={20} className={card.spinner} aria-hidden="true" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}
