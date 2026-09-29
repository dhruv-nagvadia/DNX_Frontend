import { Link } from 'react-router-dom';

import { LEGAL_LAST_UPDATED, TERMS_SECTIONS } from '@/utils/legalContent';

import styles from '../legal.module.css';

/** Public Terms of Service — no auth required, linked from signup and the mobile app. */
export default function TermsPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} to="/">
          <span className={styles.logo}>D</span>
          <span className={styles.brandName}>DNX</span>
        </Link>
      </header>

      <div className={styles.content}>
        <h1 className={styles.title}>Terms of Service</h1>
        <p className={styles.updated}>Last updated: {LEGAL_LAST_UPDATED}</p>

        <div className={styles.card}>
          {TERMS_SECTIONS.map((section) => (
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
