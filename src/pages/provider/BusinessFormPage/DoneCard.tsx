import { ChevronRight, Clock, Command, Image as ImageIcon, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Pill } from '@/components/Pill';
import type { Provider } from '@/redux/api/provider/types';

import styles from './BusinessFormPage.module.css';

interface DoneCardProps {
  business: Provider;
  photoUploadFailed: boolean;
}

/** Shown in place of the step card once a new business has been created. */
export function DoneCard({ business, photoUploadFailed }: DoneCardProps) {
  const navigate = useNavigate();
  const isStore = business.type === 'STORE';
  const goTo = (tab: 'services' | 'products' | 'hours' | 'photos') =>
    navigate(`/businesses/${business.id}`, { state: { tab } });

  const nextSteps = [
    isStore
      ? {
          icon: <Package size={26} aria-hidden="true" />,
          title: 'Add your products',
          sub: 'List the products customers can order.',
          link: 'Add products',
          tab: 'products' as const,
        }
      : {
          icon: <Command size={26} aria-hidden="true" />,
          title: 'Add your services',
          sub: 'List the services customers can book.',
          link: 'Add your services',
          tab: 'services' as const,
        },
    {
      icon: <Clock size={26} aria-hidden="true" />,
      title: 'Set your business hours',
      sub: 'Add your weekly timings and breaks.',
      link: 'Set business hours',
      tab: 'hours' as const,
    },
    {
      icon: <ImageIcon size={26} aria-hidden="true" />,
      title: 'Upload more photos',
      sub: 'Showcase your space, team and setup.',
      link: 'Upload photos',
      tab: 'photos' as const,
    },
  ];

  return (
    <section className={`${styles.card} ${styles.doneCard}`} aria-live="polite">
      <div className={styles.doneBurst} aria-hidden="true">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={`${styles.confetti} ${styles[`confetti${i}`]}`} />
        ))}
        <span className={styles.doneCheck}>
          <svg viewBox="0 0 24 24" width="52" height="52" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
      </div>

      <h2 className={styles.doneTitle}>{business.businessName} is live!</h2>
      {business.isVerified ? (
        <Pill tone="green" className={styles.doneStatus}>Verified</Pill>
      ) : (
        <Pill tone="orange" className={styles.doneStatus}>Verification pending</Pill>
      )}

      {photoUploadFailed && (
        <p className={styles.doneWarning}>
          Some photos couldn&apos;t be uploaded — you can add them from your business page.
        </p>
      )}

      <p className={styles.doneLead}>Next steps to start getting {isStore ? 'orders' : 'bookings'}:</p>

      <ul className={styles.checklist}>
        {nextSteps.map((s) => (
          <li key={s.tab} className={styles.checkRow}>
            <span className={styles.checkIcon}>{s.icon}</span>
            <span className={styles.checkText}>
              <span className={styles.checkTitle}>{s.title}</span>
              <span className={styles.checkSub}>{s.sub}</span>
            </span>
            <button type="button" className={styles.checkLink} onClick={() => goTo(s.tab)}>
              {s.link}
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>

      <div className={styles.doneActions}>
        <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnBlock}`} onClick={() => navigate(`/businesses/${business.id}`)}>
          Go to business
        </button>
        <button type="button" className={`${styles.btn} ${styles.btnOutline} ${styles.btnBlock}`} onClick={() => navigate('/businesses')}>
          Back to My Businesses
        </button>
      </div>
    </section>
  );
}
