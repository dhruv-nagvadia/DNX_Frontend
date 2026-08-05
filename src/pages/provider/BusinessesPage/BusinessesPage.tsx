import { MapPin, Pencil, Plus, Star, Store } from 'lucide-react';

import { AppShell } from '@/components/AppShell';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { CategoryIcon } from '@/components/CategoryIcon';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/Skeleton';

import { useBusinessesPage } from './useBusinessesPage';
import styles from './BusinessesPage.module.css';

/** Placeholder cards shown while the list loads. */
function LoadingGrid() {
  return (
    <div className={styles.grid} aria-busy="true" aria-label="Loading your businesses">
      {[0, 1, 2].map((i) => (
        <div className={styles.card} key={i}>
          <Skeleton height={140} radius={0} />
          <div className={styles.body}>
            <Skeleton width="70%" height={18} />
            <Skeleton width="45%" height={22} radius="999px" />
            <Skeleton width="35%" height={14} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** JSX only — logic comes from useBusinessesPage. */
export default function BusinessesPage() {
  const { userName, businesses, isLoading, addBusiness, openBusiness, editBusiness, logout } =
    useBusinessesPage();

  const addButton = (
    <Button onClick={addBusiness} iconLeft={<Plus size={18} aria-hidden="true" />}>
      Add business
    </Button>
  );

  return (
    <AppShell userName={userName} onLogout={logout}>
      <PageHeader
        title="Your businesses"
        subtitle={
          businesses.length > 0
            ? 'Open a business to manage its services, hours and photos.'
            : 'Add a business so customers can discover and book you.'
        }
        actions={businesses.length > 0 ? addButton : undefined}
      />

      {isLoading ? (
        <LoadingGrid />
      ) : businesses.length === 0 ? (
        <EmptyState
          icon={<Store size={28} strokeWidth={1.6} aria-hidden="true" />}
          title="No businesses yet"
          description="Your first business takes a couple of minutes to set up — name, category and where you work. You can add services and photos afterwards."
          action={
            <Button onClick={addBusiness} iconLeft={<Plus size={18} aria-hidden="true" />}>
              Add your first business
            </Button>
          }
        />
      ) : (
        <div className={styles.grid}>
          {businesses.map((biz) => (
            <article className={styles.card} key={biz.id}>
              {/* One button covers the card so the whole tile is one target,
                  which keeps Edit as a separate, non-nested control. */}
              <button
                type="button"
                className={styles.openButton}
                onClick={() => openBusiness(biz.id)}
              >
                <span className={styles.srOnly}>Open {biz.businessName}</span>
              </button>

              <div className={styles.cover}>
                {biz.images.length > 0 ? (
                  <img className={styles.coverImg} src={biz.images[0]} alt="" loading="lazy" />
                ) : (
                  <CategoryIcon
                    slug={biz.category.slug}
                    size={40}
                    strokeWidth={1.5}
                    className={styles.coverIcon}
                  />
                )}
                <span className={styles.rating}>
                  <Star size={13} aria-hidden="true" />
                  {biz.ratingAvg.toFixed(1)}
                  <span className={styles.ratingCount}>({biz.ratingCount})</span>
                </span>
              </div>

              <div className={styles.body}>
                <h3 className={styles.name}>{biz.businessName}</h3>

                <Badge
                  tone="brand"
                  icon={<CategoryIcon slug={biz.category.slug} size={13} />}
                  className={styles.category}
                >
                  {biz.subcategory?.name ?? biz.category.name}
                </Badge>

                <div className={styles.footer}>
                  <span className={styles.city}>
                    {biz.city ? (
                      <>
                        <MapPin size={14} aria-hidden="true" />
                        {biz.city}
                      </>
                    ) : (
                      <span className={styles.muted}>No location set</span>
                    )}
                  </span>

                  <button
                    type="button"
                    className={styles.edit}
                    onClick={() => editBusiness(biz.id)}
                  >
                    <Pencil size={14} aria-hidden="true" />
                    Edit
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}
