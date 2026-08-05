import { Store } from 'lucide-react';
import { Link } from 'react-router-dom';

import { AppShell } from '@/components/AppShell';
import { CategoryIcon } from '@/components/CategoryIcon';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/Skeleton';

import { useHomePage } from './useHomePage';
import styles from './HomePage.module.css';

/**
 * Customer-facing discovery screen on the web.
 *
 * The customer experience ships as the mobile app, so this stays deliberately
 * simple — it exists so a customer who signs in on the web isn't stranded.
 */
export default function HomePage() {
  const { userName, categories, isLoading, onCategoryClick } = useHomePage();

  return (
    <AppShell userName={userName}>
      <PageHeader
        title={userName ? `Hi, ${userName}` : 'Find a service'}
        subtitle="What do you need today? Pick a category to browse providers near you."
      />

      {/* The same account works on both sides, so a customer can list a
          business without registering again. */}
      <Link className={styles.providerCta} to="/businesses">
        <span className={styles.ctaIcon}>
          <Store size={20} aria-hidden="true" />
        </span>
        <span className={styles.ctaText}>
          <span className={styles.ctaTitle}>Run a business?</span>
          <span className={styles.ctaBody}>
            List it on DNX with this same account and start taking bookings.
          </span>
        </span>
      </Link>

      <div className={styles.grid}>
        {isLoading
          ? [0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} height={104} radius="var(--radius-lg)" />
            ))
          : categories.map((category) => (
              <button
                type="button"
                key={category.id}
                className={styles.card}
                onClick={() => onCategoryClick(category)}
              >
                <span className={styles.iconRing}>
                  <CategoryIcon slug={category.slug} size={22} strokeWidth={1.7} />
                </span>
                <span className={styles.name}>{category.name}</span>
              </button>
            ))}
      </div>
    </AppShell>
  );
}
