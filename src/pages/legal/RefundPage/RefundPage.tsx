import { Link } from 'react-router-dom';

import { REFUND_LAST_UPDATED, REFUND_POLICY_SECTIONS } from '@/utils/legalContent';

import styles from '../legal.module.css';

/** Public Refund & Cancellation Policy — no auth required, linked from signup and the mobile app. */
export default function RefundPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} to="/">
          <span className={styles.logo}>D</span>
          <span className={styles.brandName}>DNX</span>
        </Link>
      </header>

      <div className={styles.content}>
        <h1 className={styles.title}>Refund &amp; Cancellation Policy</h1>
        <p className={styles.updated}>Last updated: {REFUND_LAST_UPDATED}</p>

        <div className={styles.card}>
          {REFUND_POLICY_SECTIONS.map((section) => (
            <section key={section.heading}>
              <h2 className={styles.sectionHeading}>{section.heading}</h2>
              <p className={styles.sectionBody}>{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
