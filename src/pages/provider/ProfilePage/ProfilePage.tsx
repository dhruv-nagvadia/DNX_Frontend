import {
  Briefcase,
  ChevronRight,
  Image as ImageIcon,
  ListChecks,
  Mail,
  ShieldCheck,
  Star,
} from 'lucide-react';

import { AppShell } from '@/components/AppShell';
import { Card } from '@/components/Card';
import { CategoryIcon } from '@/components/CategoryIcon';
import { Skeleton } from '@/components/Skeleton';
import { StatTile } from '@/components/StatTile';

import { useProfilePage } from './useProfilePage';
import styles from './ProfilePage.module.css';

function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || 'DN'
  );
}

/** Provider account profile — identity, aggregate stats, and business showcase. */
export default function ProfilePage() {
  const { user, businesses, isLoading, stats, openBusiness } = useProfilePage();
  const name = user?.fullName ?? 'Your account';

  return (
    <AppShell>
      {/* Animated identity banner */}
      <header className={styles.hero}>
        <div className={styles.aurora} aria-hidden="true" />
        <div className={styles.grain} aria-hidden="true" />

        <div className={styles.identity}>
          <span className={styles.avatar} aria-hidden="true">
            {initialsOf(name)}
          </span>
          <div className={styles.idText}>
            <h1 className={styles.name}>{name}</h1>
            {user?.email && (
              <span className={styles.email}>
                <Mail size={14} aria-hidden="true" />
                {user.email}
              </span>
            )}
            <span className={styles.roleBadge}>
              <ShieldCheck size={13} aria-hidden="true" />
              Provider account
            </span>
          </div>
        </div>
      </header>

      {/* Aggregate stats */}
      <div className={styles.stats}>
        {[
          {
            label: 'Businesses',
            value: stats.businesses,
            icon: <Briefcase size={16} aria-hidden="true" />,
          },
          {
            label: 'Services',
            value: stats.services,
            icon: <ListChecks size={16} aria-hidden="true" />,
          },
          {
            label: 'Photos',
            value: stats.photos,
            icon: <ImageIcon size={16} aria-hidden="true" />,
          },
          {
            label: 'Avg rating',
            value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—',
            icon: <Star size={16} aria-hidden="true" />,
          },
        ].map((s, i) => (
          <div key={s.label} className={styles.statItem} style={{ animationDelay: `${i * 70}ms` }}>
            <StatTile label={s.label} value={s.value} icon={s.icon} />
          </div>
        ))}
      </div>

      {/* Business showcase */}
      <Card title="Your businesses" subtitle="Everything you run on DNX, in one place.">
        {isLoading ? (
          <div className={styles.showcase}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={150} radius="var(--radius-lg)" />
            ))}
          </div>
        ) : businesses.length === 0 ? (
          <p className={styles.muted}>No businesses yet — add one to start taking bookings.</p>
        ) : (
          <div className={styles.showcase}>
            {businesses.map((b) => (
              <button
                key={b.id}
                type="button"
                className={styles.showcaseItem}
                onClick={() => openBusiness(b.id)}
              >
                <div className={styles.showcaseImg}>
                  {b.images.length > 0 ? (
                    <img src={b.images[0]} alt="" loading="lazy" />
                  ) : (
                    <span className={styles.showcaseFallback}>
                      <CategoryIcon slug={b.category.slug} size={30} strokeWidth={1.5} />
                    </span>
                  )}
                </div>
                <div className={styles.showcaseBody}>
                  <span className={styles.showcaseName}>{b.businessName}</span>
                  <span className={styles.showcaseMeta}>
                    {b.subcategory?.name ?? b.category.name}
                  </span>
                </div>
                <ChevronRight size={16} aria-hidden="true" className={styles.showcaseChevron} />
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Account details */}
      <Card title="Account details">
        <dl className={styles.details}>
          <div className={styles.detailItem}>
            <dt className={styles.detailLabel}>Full name</dt>
            <dd className={styles.detailValue}>{user?.fullName || '—'}</dd>
          </div>
          <div className={styles.detailItem}>
            <dt className={styles.detailLabel}>Email</dt>
            <dd className={styles.detailValue}>{user?.email || '—'}</dd>
          </div>
          <div className={styles.detailItem}>
            <dt className={styles.detailLabel}>Account type</dt>
            <dd className={styles.detailValue}>Provider</dd>
          </div>
        </dl>
        <p className={styles.hint}>
          Business details like email, address and hours are managed on each business page.
        </p>
      </Card>
    </AppShell>
  );
}
