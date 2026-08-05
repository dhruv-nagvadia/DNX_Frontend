import { useRef } from 'react';
import { Navigate } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Clock,
  ImagePlus,
  ListChecks,
  Mail,
  MapPin,
  Phone,
  Star,
} from 'lucide-react';

import { AppShell } from '@/components/AppShell';
import { Badge } from '@/components/Badge';
import { BusinessHours } from '@/components/BusinessHours';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CategoryIcon } from '@/components/CategoryIcon';
import { ServicesManager } from '@/components/ServicesManager';
import { Skeleton } from '@/components/Skeleton';
import { StatTile } from '@/components/StatTile';

import { useBusinessDetail } from './useBusinessDetail';
import styles from './BusinessDetailPage.module.css';

/** JSX only — logic comes from useBusinessDetail. */
export default function BusinessDetailPage() {
  const { business, isLoading, notFound, uploading, addImages, goToEdit, goBack } =
    useBusinessDetail();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (notFound) return <Navigate to="/businesses" replace />;

  const backButton = (
    <button type="button" className={styles.back} onClick={goBack}>
      <ArrowLeft size={16} aria-hidden="true" />
      <span className={styles.backLabel}>All businesses</span>
    </button>
  );

  if (isLoading || !business) {
    return (
      <AppShell topbarExtra={backButton}>
        <Skeleton height={220} radius="var(--radius-xl)" />
        <div className={styles.stats}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={92} radius="var(--radius-lg)" />
          ))}
        </div>
        <Skeleton height={150} radius="var(--radius-xl)" />
      </AppShell>
    );
  }

  const address = [business.addressLine, business.city, business.state, business.postalCode]
    .filter(Boolean)
    .join(', ');

  const contact = [
    { icon: <Phone size={16} aria-hidden="true" />, label: 'Phone', value: business.phone },
    { icon: <Mail size={16} aria-hidden="true" />, label: 'Email', value: business.email },
    { icon: <MapPin size={16} aria-hidden="true" />, label: 'Address', value: address },
  ];

  return (
    <AppShell
      topbarExtra={
        <>
          {backButton}
          <Button variant="secondary" onClick={goToEdit}>
            Edit business
          </Button>
        </>
      }
    >
      {/* Hero: cover photo with the identity laid over a scrim so the text
          stays legible on any uploaded image. */}
      <header className={styles.hero}>
        {business.images.length > 0 ? (
          <img className={styles.heroImg} src={business.images[0]} alt="" />
        ) : (
          <span className={styles.heroFallback}>
            <CategoryIcon slug={business.category.slug} size={56} strokeWidth={1.4} />
          </span>
        )}

        <div className={styles.scrim} />

        <div className={styles.heroContent}>
          <h1 className={styles.name}>{business.businessName}</h1>
          <div className={styles.badges}>
            <Badge tone="accent" icon={<CategoryIcon slug={business.category.slug} size={13} />}>
              {business.subcategory?.name ?? business.category.name}
            </Badge>
            {business.isVerified ? (
              <Badge tone="success" icon={<BadgeCheck size={13} aria-hidden="true" />}>
                Verified
              </Badge>
            ) : (
              <Badge tone="warning" icon={<Clock size={13} aria-hidden="true" />}>
                Verification pending
              </Badge>
            )}
            <Badge tone="neutral" icon={<Star size={13} aria-hidden="true" />}>
              {business.ratingAvg.toFixed(1)} ({business.ratingCount})
            </Badge>
          </div>
        </div>
      </header>

      <div className={styles.stats}>
        <StatTile
          label="Services"
          value={business.services.length}
          icon={<ListChecks size={16} aria-hidden="true" />}
          note={business.services.length === 0 ? 'Add your first service' : 'Bookable now'}
        />
        <StatTile
          label="Bookings"
          value={0}
          icon={<CalendarDays size={16} aria-hidden="true" />}
          note="Starts once customers can book"
        />
        <StatTile
          label="Photos"
          value={business.images.length}
          icon={<ImagePlus size={16} aria-hidden="true" />}
          note={business.images.length === 0 ? 'Photos lift bookings' : 'On your public profile'}
        />
      </div>

      <Card title="About">
        {business.description ? (
          <p className={styles.about}>{business.description}</p>
        ) : (
          <p className={styles.muted}>
            No description yet. A short paragraph about what you do helps customers choose you.
          </p>
        )}
      </Card>

      <Card title="Contact & location">
        <dl className={styles.infoGrid}>
          {contact.map((item) => (
            <div className={styles.infoItem} key={item.label}>
              <span className={styles.infoIcon}>{item.icon}</span>
              <div className={styles.infoText}>
                <dt className={styles.infoLabel}>{item.label}</dt>
                <dd className={styles.infoValue}>
                  {item.value || <span className={styles.muted}>Not added</span>}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      </Card>

      <Card
        title="Photos"
        subtitle="The first photo is used as your cover image."
        action={
          <>
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              loading={uploading}
              loadingText="Uploading…"
              iconLeft={<ImagePlus size={16} aria-hidden="true" />}
            >
              Add photos
            </Button>
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
          </>
        }
      >
        {business.images.length > 0 ? (
          <div className={styles.gallery}>
            {business.images.map((url, i) => (
              <div className={styles.galleryItem} key={url}>
                <img className={styles.galleryImg} src={url} alt="" loading="lazy" />
                {i === 0 && <span className={styles.coverTag}>Cover</span>}
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.muted}>
            No photos yet. Businesses with photos get noticeably more bookings.
          </p>
        )}
      </Card>

      <ServicesManager providerId={business.id} services={business.services} />

      <BusinessHours providerId={business.id} hours={business.businessHours} />
    </AppShell>
  );
}
