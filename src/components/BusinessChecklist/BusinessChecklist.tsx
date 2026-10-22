import { ArrowRight } from 'lucide-react';

import { Card } from '@/components/Card';
import { Provider } from '@/redux/api/provider/types';

import { stepsFor } from './profile';
import styles from './BusinessChecklist.module.css';

interface BusinessChecklistProps {
  businesses: Provider[];
  /** Jump to a section tab of one business (e.g. 'services', 'photos', 'calendar'). */
  onGoTo: (businessId: string, tab: string) => void;
  /** Open one business's edit form (for description / email). */
  onEdit: (businessId: string) => void;
}

const RING_RADIUS = 21;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

/** Round progress indicator with the percentage in the middle. */
function ProgressRing({ pct, label }: { pct: number; label: string }) {
  return (
    <div className={styles.ring} role="img" aria-label={label}>
      <svg viewBox="0 0 52 52" width="52" height="52" aria-hidden="true">
        <circle className={styles.ringTrack} cx="26" cy="26" r={RING_RADIUS} />
        <circle
          className={styles.ringFill}
          cx="26"
          cy="26"
          r={RING_RADIUS}
          strokeDasharray={RING_LENGTH}
          strokeDashoffset={RING_LENGTH * (1 - pct / 100)}
        />
      </svg>
      <span className={styles.ringText}>{pct}%</span>
    </div>
  );
}

/**
 * Nudges the provider to finish their profile — one card per business that
 * still has steps pending. Complete businesses are left out, and nothing
 * renders at all once every business is done.
 */
export function BusinessChecklist({ businesses, onGoTo, onEdit }: BusinessChecklistProps) {
  const groups = businesses
    .map((business) => {
      const steps = stepsFor(business, onGoTo, onEdit);
      const pending = steps.filter((st) => !st.done);
      return {
        business,
        pending,
        pct: Math.round(((steps.length - pending.length) / steps.length) * 100),
      };
    })
    .filter((g) => g.pending.length > 0);

  if (groups.length === 0) return null;

  return (
    <div className={styles.grid}>
      {groups.map(({ business, pending, pct }) => (
        <Card
          key={business.id}
          title={business.businessName}
          subtitle={`${business.type === 'STORE' ? 'Store' : 'Service'} · ${pending.length} ${
            pending.length === 1 ? 'step' : 'steps'
          } left to finish`}
          action={<ProgressRing pct={pct} label={`${business.businessName} is ${pct}% complete`} />}
          className={styles.card}
        >
          <ul className={styles.list}>
            {pending.map((step) => (
              <li key={step.label}>
                <button type="button" className={styles.item} onClick={step.go}>
                  <span className={styles.dot} aria-hidden="true" />
                  <span className={styles.label}>{step.label}</span>
                  <ArrowRight size={14} aria-hidden="true" className={styles.arrow} />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
