import { AuthLayoutProps } from './types';
import styles from './AuthLayout.module.css';

const BENEFITS = [
  'List your business & get discovered by new customers',
  'Manage appointments and your calendar in one place',
  'Collect payments and send invoices effortlessly',
  'Track customers, history, and business insights',
];

/**
 * Split-screen auth shell: branded provider value-prop on the left,
 * the form (children) on the right. Collapses to form-only on mobile.
 */
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className={styles.wrapper}>
      <aside className={styles.brand}>
        <div className={styles.logo}>DNX for Business</div>

        <div className={styles.brandBody}>
          <h1 className={styles.headline}>Grow your business with DNX</h1>
          <p className={styles.subhead}>
            The all-in-one platform for service providers — salons, clinics, plumbers, tutors,
            kirana stores and more.
          </p>
          <ul className={styles.benefits}>
            {BENEFITS.map((b) => (
              <li key={b} className={styles.benefit}>
                <span className={styles.check}>✓</span>
                {b}
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.footer}>© {new Date().getFullYear()} DNX. All rights reserved.</div>
      </aside>

      <main className={styles.formPanel}>
        <div className={styles.formCard}>{children}</div>
      </main>
    </div>
  );
}
