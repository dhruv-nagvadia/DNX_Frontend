import { useRef } from 'react';
import { Navigate } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Clock,
  Image as ImageIcon,
  ImagePlus,
  Info,
  ListChecks,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Star,
} from 'lucide-react';

import { AppShell } from '@/components/AppShell';
import { Badge } from '@/components/Badge';
import { BusinessBookings } from '@/components/BusinessBookings';
import { BusinessChecklist } from '@/components/BusinessChecklist';
import { BusinessHours } from '@/components/BusinessHours';
import { BusinessReviews } from '@/components/BusinessReviews';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CategoryIcon } from '@/components/CategoryIcon';
import { EarningsPanel } from '@/components/EarningsPanel';
import { ServicesManager } from '@/components/ServicesManager';
import { Skeleton } from '@/components/Skeleton';
import { Tabs } from '@/components/Tabs';
import { UpcomingAppointments } from '@/components/UpcomingAppointments';

import { BusinessTab, useBusinessDetail } from './useBusinessDetail';
import styles from './BusinessDetailPage.module.css';

/** JSX only — logic comes from useBusinessDetail. */
export default function BusinessDetailPage() {
  const {
    business,
    isLoading,
    notFound,
    uploading,
    bookingCount,
    activeTab,
    setActiveTab,
    addImages,
    goToEdit,
    goToReviews,
    goBack,
  } = useBusinessDetail();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (notFound) return <Navigate to="/businesses" replace />;

  if (isLoading || !business) {
    return (
      <AppShell>
        <Skeleton height={220} radius="var(--radius-xl)" />
        <Skeleton height={280} radius="var(--radius-xl)" />
        <Skeleton height={150} radius="var(--radius-xl)" />
      </AppShell>
    );
  }

  const address = [business.addressLine, business.city, business.state, business.postalCode]
    .filter(Boolean)
    .join(', ');

  const contact = [
    { icon: <Phone size={16} aria-hidden="true" />, label: 'Phone', value: business.phone, wide: false },
    { icon: <Mail size={16} aria-hidden="true" />, label: 'Email', value: business.email, wide: false },
    { icon: <MapPin size={16} aria-hidden="true" />, label: 'Address', value: address, wide: true },
  ];

  const sections = [
    { id: 'overview', label: 'Overview', icon: <Info size={16} aria-hidden="true" /> },
    {
      id: 'services',
      label: 'Services',
      icon: <ListChecks size={16} aria-hidden="true" />,
      count: business.services.length,
    },
    {
      id: 'bookings',
      label: 'Bookings',
      icon: <CalendarDays size={16} aria-hidden="true" />,
      count: bookingCount,
    },
    {
      id: 'photos',
      label: 'Photos',
      icon: <ImageIcon size={16} aria-hidden="true" />,
      count: business.images.length,
    },
    { id: 'hours', label: 'Hours', icon: <Clock size={16} aria-hidden="true" /> },
  ];

  return (
    <AppShell>
      <button type="button" className={styles.back} onClick={goBack}>
        <ArrowLeft size={16} aria-hidden="true" />
        All businesses
      </button>

      {/* Hero: cover photo with the identity laid over a scrim. */}
      <header className={styles.hero}>
        {business.images.length > 0 ? (
          <img className={styles.heroImg} src={business.images[0]} alt="" />
        ) : (
          <span className={styles.heroFallback}>
            <CategoryIcon slug={business.category.slug} size={56} strokeWidth={1.4} />
          </span>
        )}

        <div className={styles.scrim} />

        <button type="button" className={styles.editBtn} onClick={goToEdit}>
          <Pencil size={15} aria-hidden="true" />
          Edit business
        </button>

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

      {/* Themed section header. */}
      <Tabs
        tabs={sections}
        active={activeTab}
        onChange={(id) => setActiveTab(id as BusinessTab)}
      />

      {/* Overview */}
      {activeTab === 'overview' && (
        <>
          {/* Narrower graph on the left, About on the right. About matches the
              graph's height and scrolls internally — it never resizes the graph. */}
          <div className={`${styles.overviewCols} ${styles.overviewTop}`}>
            <EarningsPanel providerId={business.id} />

            <div className={styles.aboutCell}>
              <Card title="About" className={styles.aboutCard}>
                {business.description ? (
                  <p className={styles.about}>{business.description}</p>
                ) : (
                  <p className={styles.muted}>
                    No description yet. A short paragraph about what you do helps customers choose
                    you.
                  </p>
                )}
              </Card>
            </div>
          </div>

          {/* Full-width appointments with customer + payment details. */}
          <UpcomingAppointments
            providerId={business.id}
            onViewAll={() => setActiveTab('bookings')}
          />

          <div className={styles.overviewCols}>
            <Card title="Contact & location">
              <dl className={styles.infoGrid}>
                {contact.map((item) => (
                  <div
                    className={`${styles.infoItem} ${item.wide ? styles.infoItemWide : ''}`}
                    key={item.label}
                  >
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

            <BusinessChecklist
              business={business}
              onGoTo={(t) => setActiveTab(t as BusinessTab)}
              onEdit={goToEdit}
            />
          </div>

          <BusinessReviews limit={3} onViewAll={goToReviews} />
        </>
      )}

      {/* Services */}
      {activeTab === 'services' && (
        <ServicesManager providerId={business.id} services={business.services} />
      )}

      {/* Bookings */}
      {activeTab === 'bookings' && <BusinessBookings providerId={business.id} />}

      {/* Photos */}
      {activeTab === 'photos' && (
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
      )}

      {/* Hours */}
      {activeTab === 'hours' && (
        <BusinessHours providerId={business.id} hours={business.businessHours} />
      )}
    </AppShell>
  );
}
