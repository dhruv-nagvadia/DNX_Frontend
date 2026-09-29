import { Link } from 'react-router-dom';

import { LEGAL_LAST_UPDATED, PRIVACY_POLICY_SECTIONS } from '@/utils/legalContent';

import styles from '../legal.module.css';

/** Public Privacy Policy — no auth required, linked from signup and the mobile app. */
export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} to="/">
          <span className={styles.logo}>D</span>
          <span className={styles.brandName}>DNX</span>
        </Link>
      </header>

      <div className={styles.content}>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.updated}>Last updated: {LEGAL_LAST_UPDATED}</p>

        <div className={styles.card}>
          {PRIVACY_POLICY_SECTIONS.map((section) => (
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
