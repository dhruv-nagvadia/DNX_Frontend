import { BadgeCheck, Clock, Pencil, Plus, Star, Store } from 'lucide-react';

import { AppShell } from '@/components/AppShell';
import { Badge } from '@/components/Badge';
import { profileProgress } from '@/components/BusinessChecklist';
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
          <div className={styles.top}>
            <Skeleton width={52} height={52} radius="var(--radius-md)" />
            <div className={styles.titles}>
              <Skeleton width="65%" height={16} />
              <Skeleton width="45%" height={14} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** JSX only — logic comes from useBusinessesPage. */
export default function BusinessesPage() {
  const { businesses, isLoading, addBusiness, openBusiness, editBusiness } = useBusinessesPage();

  const addButton = (
    <Button onClick={addBusiness} iconLeft={<Plus size={18} aria-hidden="true" />}>
      Add business
    </Button>
  );

  return (
    <AppShell>
      <PageHeader
        title="Your businesses"
        subtitle={
          businesses.length > 0
            ? 'Open a business to manage its services, products, hours and photos.'
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
          {businesses.map((biz) => {
            const isStore = biz.type === 'STORE';
            const itemCount = isStore ? (biz.products?.length ?? 0) : biz.services.length;
            const itemLabel = isStore ? 'product' : 'service';
            const { pending } = profileProgress(biz);
            const place = [biz.subcategory?.name ?? biz.category.name, biz.city]
              .filter(Boolean)
              .join(' · ');
            return (
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

                <div className={styles.top}>
                  <div className={styles.thumb}>
                    {biz.images.length > 0 ? (
                      <img className={styles.coverImg} src={biz.images[0]} alt="" loading="lazy" />
                    ) : (
                      <CategoryIcon
                        slug={biz.category.slug}
                        size={24}
                        strokeWidth={1.6}
                        className={styles.coverIcon}
                      />
                    )}
                  </div>
                  <div className={styles.titles}>
                    <h3 className={styles.name}>{biz.businessName}</h3>
                    <p className={styles.place}>{place}</p>
                  </div>
                  <button
                    type="button"
                    className={styles.edit}
                    onClick={() => editBusiness(biz.id)}
                    aria-label={`Edit ${biz.businessName}`}
                  >
                    <Pencil size={15} aria-hidden="true" />
                  </button>
                </div>

                <div className={styles.info}>
                  <span className={styles.meta}>
                    {itemCount} {itemLabel}
                    {itemCount === 1 ? '' : 's'}
                    <span className={styles.dot} aria-hidden="true">
                      ·
                    </span>
                    <Star size={13} aria-hidden="true" className={styles.star} />
                    {biz.ratingAvg.toFixed(1)}
                  </span>

                  {biz.isBlocked ? (
                    <Badge tone="error">Blocked</Badge>
                  ) : biz.isVerified ? (
                    <Badge tone="success" icon={<BadgeCheck size={13} aria-hidden="true" />}>
                      Verified
                    </Badge>
                  ) : (
                    <Badge tone="warning" icon={<Clock size={13} aria-hidden="true" />}>
                      Pending
                    </Badge>
                  )}
                </div>

                {pending > 0 && (
                  <p className={styles.todo}>
                    {pending} {pending === 1 ? 'step' : 'steps'} left to finish your profile
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
