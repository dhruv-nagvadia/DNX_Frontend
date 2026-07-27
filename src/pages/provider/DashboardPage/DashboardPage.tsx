import { useRef } from 'react';
import { Navigate } from 'react-router-dom';

import { categoryIcon } from '@/utils/categoryIcons';
import { useDashboardPage } from './useDashboardPage';
import styles from './DashboardPage.module.css';

/** JSX only — logic comes from useDashboardPage. */
export default function DashboardPage() {
  const { provider, isLoading, noProfile, uploading, addImages, logout } = useDashboardPage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (noProfile) return <Navigate to="/onboarding" replace />;

  if (isLoading || !provider) {
    return (
      <div className={styles.page}>
        <div className={styles.center}>Loading your business…</div>
      </div>
    );
  }

  const address = [provider.addressLine, provider.city, provider.state, provider.postalCode]
    .filter(Boolean)
    .join(', ');

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <span className={styles.logo}>DNX for Business</span>
          <button className={styles.logout} onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <div className={styles.container}>
        {/* Cover */}
        <div className={styles.cover}>
          {provider.images.length > 0 ? (
            <img className={styles.coverImg} src={provider.images[0]} alt={provider.businessName} />
          ) : (
            <span className={styles.coverEmoji}>{categoryIcon(provider.category.slug)}</span>
          )}
        </div>

        {/* Header */}
        <section className={styles.headerCard}>
          <div className={styles.titleRow}>
            <div>
              <h1 className={styles.bizName}>{provider.businessName}</h1>
              <div className={styles.badges}>
                <span className={styles.categoryChip}>
                  {categoryIcon(provider.category.slug)} {provider.category.name}
                </span>
                {provider.isVerified ? (
                  <span className={styles.verified}>✓ Verified</span>
                ) : (
                  <span className={styles.pending}>● Verification pending</span>
                )}
              </div>
            </div>
            <span className={styles.rating}>
              ⭐ {provider.ratingAvg.toFixed(1)} ({provider.ratingCount} reviews)
            </span>
          </div>

          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Phone</span>
              <span className={styles.infoValue}>{provider.phone}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Email</span>
              <span className={styles.infoValue}>{provider.email || '—'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Address</span>
              <span className={styles.infoValue}>{address || '—'}</span>
            </div>
          </div>
        </section>

        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statValue}>{provider.services.length}</div>
            <div className={styles.statLabel}>Services</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>0</div>
            <div className={styles.statLabel}>Bookings</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>{provider.images.length}</div>
            <div className={styles.statLabel}>Photos</div>
          </div>
        </div>

        {/* About */}
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h3 className={styles.cardTitle}>About</h3>
          </div>
          {provider.description ? (
            <p className={styles.about}>{provider.description}</p>
          ) : (
            <p className={styles.muted}>No description added yet.</p>
          )}
        </section>

        {/* Photos */}
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h3 className={styles.cardTitle}>Photos</h3>
            <button
              className={styles.addBtn}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading…' : '+ Add photos'}
            </button>
            <input
              ref={fileInputRef}
              className={styles.hiddenInput}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                addImages(e.target.files);
                e.target.value = '';
              }}
            />
          </div>

          {provider.images.length > 0 ? (
            <div className={styles.gallery}>
              {provider.images.map((url) => (
                <div className={styles.galleryItem} key={url}>
                  <img className={styles.galleryImg} src={url} alt={provider.businessName} />
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.muted}>No photos yet. Add some to attract more customers.</p>
          )}
        </section>

        {/* Services (placeholder for next phase) */}
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h3 className={styles.cardTitle}>Services</h3>
          </div>
          <p className={styles.muted}>
            Add the services you offer with prices and durations — coming next.
          </p>
        </section>
      </div>
    </div>
  );
}
