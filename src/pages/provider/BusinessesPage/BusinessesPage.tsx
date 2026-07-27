import { LogOut, Plus, Pencil, MapPin, Star, Store } from 'lucide-react';

import { Button } from '@/components/Button';
import { CategoryIcon } from '@/components/CategoryIcon';
import { useBusinessesPage } from './useBusinessesPage';
import styles from './BusinessesPage.module.css';

/** JSX only — logic comes from useBusinessesPage. */
export default function BusinessesPage() {
  const { userName, businesses, isLoading, addBusiness, openBusiness, editBusiness, logout } =
    useBusinessesPage();

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <span className={styles.logo}>DNX for Business</span>
          <button className={styles.logout} onClick={logout}>
            <LogOut size={16} /> Log out
          </button>
        </div>
      </header>

      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>My Businesses</h1>
            <p className={styles.subtitle}>
              {userName ? `Welcome back, ${userName}. ` : ''}
              Manage all your businesses in one place.
            </p>
          </div>
          {businesses.length > 0 && (
            <Button className={styles.addBtn} onClick={addBusiness}>
              <Plus size={18} /> Add business
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className={styles.center}>Loading your businesses…</div>
        ) : businesses.length === 0 ? (
          <div className={styles.empty}>
            <Store className={styles.emptyIcon} size={48} strokeWidth={1.5} />
            <h2 className={styles.emptyTitle}>No businesses yet</h2>
            <p className={styles.emptyText}>
              Add your first business so customers can discover and book you.
            </p>
            <Button className={styles.addBtn} onClick={addBusiness}>
              <Plus size={18} /> Add your first business
            </Button>
          </div>
        ) : (
          <div className={styles.grid}>
            {businesses.map((biz) => (
              <div key={biz.id} className={styles.card} onClick={() => openBusiness(biz.id)}>
                <div className={styles.cover}>
                  {biz.images.length > 0 ? (
                    <img className={styles.coverImg} src={biz.images[0]} alt={biz.businessName} />
                  ) : (
                    <CategoryIcon
                      slug={biz.category.slug}
                      size={44}
                      strokeWidth={1.5}
                      className={styles.coverIcon}
                    />
                  )}
                </div>

                <div className={styles.cardBody}>
                  <h3 className={styles.bizName}>{biz.businessName}</h3>
                  <div className={styles.chipRow}>
                    <span className={styles.categoryChip}>
                      <CategoryIcon slug={biz.category.slug} size={13} /> {biz.category.name}
                    </span>
                  </div>
                  {biz.city && (
                    <span className={styles.meta}>
                      <MapPin size={14} /> {biz.city}
                    </span>
                  )}

                  <div className={styles.cardFooter}>
                    <span className={styles.rating}>
                      <Star size={14} /> {biz.ratingAvg.toFixed(1)} ({biz.ratingCount})
                    </span>
                    <button
                      className={styles.editLink}
                      onClick={(e) => {
                        e.stopPropagation();
                        editBusiness(biz.id);
                      }}
                    >
                      <Pencil size={14} /> Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
