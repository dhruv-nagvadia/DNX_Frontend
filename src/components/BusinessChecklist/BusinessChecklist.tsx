import { Check, ChevronRight, PartyPopper } from 'lucide-react';

import { Card } from '@/components/Card';
import { Provider } from '@/redux/api/provider/types';

import styles from './BusinessChecklist.module.css';

interface BusinessChecklistProps {
  business: Provider;
  /** Jump to a section tab (e.g. 'services', 'photos', 'hours'). */
  onGoTo: (tab: string) => void;
  /** Open the edit form (for description / email). */
  onEdit: () => void;
}

/** A completeness checklist that nudges the provider to finish their profile. */
export function BusinessChecklist({ business, onGoTo, onEdit }: BusinessChecklistProps) {
  const items = [
    { label: 'Add a description', done: !!business.description, action: onEdit },
    {
      label: 'List at least one service',
      done: business.services.length > 0,
      action: () => onGoTo('services'),
    },
    { label: 'Upload photos', done: business.images.length > 0, action: () => onGoTo('photos') },
    {
      label: 'Set your business hours',
      done: business.businessHours.some((h) => h.isOpen),
      action: () => onGoTo('hours'),
    },
    { label: 'Add a contact email', done: !!business.email, action: onEdit },
  ];

  const done = items.filter((i) => i.done).length;
  const total = items.length;
  const pct = Math.round((done / total) * 100);
  const complete = done === total;

  return (
    <Card title="Complete your profile" subtitle={`${done} of ${total} done`}>
      <div className={styles.progressRow}>
        <span className={styles.track}>
          <span className={styles.fill} style={{ width: `${pct}%` }} />
        </span>
        <span className={styles.pct}>{pct}%</span>
      </div>

      {complete ? (
        <div className={styles.doneNote}>
          <PartyPopper size={18} aria-hidden="true" />
          All set — your profile looks great to customers.
        </div>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.label}>
              {item.done ? (
                <div className={`${styles.item} ${styles.itemDone}`}>
                  <span className={`${styles.mark} ${styles.markDone}`}>
                    <Check size={13} aria-hidden="true" />
                  </span>
                  <span className={styles.label}>{item.label}</span>
                </div>
              ) : (
                <button type="button" className={styles.item} onClick={item.action}>
                  <span className={styles.mark} aria-hidden="true" />
                  <span className={styles.label}>{item.label}</span>
                  <ChevronRight size={15} aria-hidden="true" className={styles.chevron} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
