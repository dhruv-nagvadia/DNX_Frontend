import { useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Phone, Mail, MapPin, Star, BadgeCheck, Clock, ImagePlus } from 'lucide-react';

import { Button } from '@/components/Button';
import { CategoryIcon } from '@/components/CategoryIcon';
import { useBusinessDetail } from './useBusinessDetail';
import styles from './BusinessDetailPage.module.css';

/** JSX only — logic comes from useBusinessDetail. */
export default function BusinessDetailPage() {
  const { business, isLoading, notFound, uploading, addImages, goToEdit, goBack } =
    useBusinessDetail();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (notFound) return <Navigate to="/businesses" replace />;

  if (isLoading || !business) {
    return (
      <div className={styles.page}>
        <div className={styles.center}>Loading business…</div>
      </div>
    );
  }

  const address = [business.addressLine, business.city, business.state, business.postalCode]
    .filter(Boolean)
    .join(', ');

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <button className={styles.back} onClick={goBack}>
            <ArrowLeft size={16} /> All businesses
          </button>
          <Button className={styles.editBtn} variant="secondary" onClick={goToEdit}>
            <Pencil size={16} /> Edit
          </Button>
        </div>
      </header>

      <div className={styles.container}>
        <div className={styles.cover}>
          {business.images.length > 0 ? (
            <img className={styles.coverImg} src={business.images[0]} alt={business.businessName} />
          ) : (
            <CategoryIcon
              slug={business.category.slug}
              size={64}
              strokeWidth={1.4}
              className={styles.coverIcon}
            />
          )}
        </div>

        <section className={styles.headerCard}>
          <div className={styles.titleRow}>
            <div>
              <h1 className={styles.bizName}>{business.businessName}</h1>
              <div className={styles.badges}>
                <span className={styles.categoryChip}>
                  <CategoryIcon slug={business.category.slug} size={14} />{' '}
                  {business.subcategory?.name ?? business.category.name}
                </span>
                {business.isVerified ? (
                  <span className={styles.verified}>
                    <BadgeCheck size={14} /> Verified
                  </span>
                ) : (
                  <span className={styles.pending}>
                    <Clock size={14} /> Verification pending
                  </span>
                )}
              </div>
            </div>
            <span className={styles.rating}>
              <Star size={15} /> {business.ratingAvg.toFixed(1)} ({business.ratingCount} reviews)
            </span>
          </div>

          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <Phone className={styles.infoIcon} size={18} />
              <div>
                <div className={styles.infoLabel}>Phone</div>
                <div className={styles.infoValue}>{business.phone}</div>
              </div>
            </div>
            <div className={styles.infoItem}>
              <Mail className={styles.infoIcon} size={18} />
              <div>
                <div className={styles.infoLabel}>Email</div>
                <div className={styles.infoValue}>{business.email || '—'}</div>
              </div>
            </div>
            <div className={styles.infoItem}>
              <MapPin className={styles.infoIcon} size={18} />
              <div>
                <div className={styles.infoLabel}>Address</div>
                <div className={styles.infoValue}>{address || '—'}</div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statValue}>{business.services.length}</div>
            <div className={styles.statLabel}>Services</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>0</div>
            <div className={styles.statLabel}>Bookings</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>{business.images.length}</div>
            <div className={styles.statLabel}>Photos</div>
          </div>
        </div>

        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h3 className={styles.cardTitle}>About</h3>
          </div>
          {business.description ? (
            <p className={styles.about}>{business.description}</p>
          ) : (
            <p className={styles.muted}>No description added yet.</p>
          )}
        </section>

        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h3 className={styles.cardTitle}>Photos</h3>
            <button
              className={styles.addBtn}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <ImagePlus size={16} /> {uploading ? 'Uploading…' : 'Add photos'}
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

          {business.images.length > 0 ? (
            <div className={styles.gallery}>
              {business.images.map((url) => (
                <div className={styles.galleryItem} key={url}>
                  <img className={styles.galleryImg} src={url} alt={business.businessName} />
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.muted}>No photos yet. Add some to attract more customers.</p>
          )}
        </section>

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
