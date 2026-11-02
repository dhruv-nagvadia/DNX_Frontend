import { useRef, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import {
  AlertTriangle,
  Ban,
  BadgeCheck,
  Boxes,
  Calendar,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Home,
  Image as ImageIcon,
  ImagePlus,
  Mail,
  MapPin,
  Package,
  Pencil,
  Phone,
  Scissors,
  Star,
  Tag,
  Trash2,
  X,
} from 'lucide-react';

import { AppShell } from '@/components/AppShell';
import { useAppShell } from '@/components/AppShell/useAppShell';
import shellStyles from '@/components/AppShell/AppShell.module.css';
import { BusinessBookings } from '@/components/BusinessBookings';
import { BusinessCalendar } from '@/components/BusinessCalendar';
import { BusinessHours } from '@/components/BusinessHours';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CategoryIcon } from '@/components/CategoryIcon';
import { EarningsPanel } from '@/components/EarningsPanel';
import { TopSellersPanel, useTopSellers } from '@/components/TopSellersPanel';
import { ModernCard, ModernCardLink } from '@/components/ModernCard';
import { CouponsManager } from '@/components/CouponsManager';
import { NotificationBell } from '@/components/NotificationBell';
import { OrdersManager } from '@/components/OrdersManager';
import { ProductsManager } from '@/components/ProductsManager';
import { ServicesManager } from '@/components/ServicesManager';
import { Skeleton } from '@/components/Skeleton';
import { StockManager } from '@/components/StockManager';
import { UpcomingAppointments } from '@/components/UpcomingAppointments';

import { RecentReviews } from './RecentReviews';
import { BusinessTab, useBusinessDetail } from './useBusinessDetail';
import styles from './BusinessDetailPage.module.css';

/** JSX only — logic comes from useBusinessDetail. */
/** ": the reason." — always ends in exactly one full stop, so the sentence after it reads on cleanly. */
function reasonSentence(reason?: string | null): string {
  return reason ? `: ${reason.trim().replace(/[.!?]+$/, '')}.` : '.';
}

/** Returns up to two initials for the account avatar (mirrors AppShell's own). */
function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'DN'
  );
}

export default function BusinessDetailPage() {
  const {
    business,
    isLoading,
    notFound,
    loadFailed,
    uploading,
    savingImages,
    deleting,
    activeTab,
    setActiveTab,
    addImages,
    setCover,
    removeImage,
    remove,
    goToEdit,
    goToReviews,
  } = useBusinessDetail();
  const { user } = useAppShell();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [blockedBannerDismissed, setBlockedBannerDismissed] = useState(false);
  const [codBannerDismissed, setCodBannerDismissed] = useState(false);
  // Shares the Top Sellers query (RTK dedupes it) — feeds the "Busiest Day" card.
  const { data: sellers } = useTopSellers(business?.id ?? '', business?.type ?? 'SERVICE');

  if (notFound) return <Navigate to="/businesses" replace />;

  if (loadFailed) {
    return (
      <AppShell>
        <Card title="Couldn't load this business">
          <p className={styles.muted}>
            Something went wrong loading it. If you just changed the backend, make sure it has been
            restarted, then refresh this page.
          </p>
        </Card>
      </AppShell>
    );
  }

  if (isLoading || !business) {
    return (
      <AppShell>
        <Skeleton height={220} radius="var(--radius-xl)" />
        <Skeleton height={280} radius="var(--radius-xl)" />
        <Skeleton height={150} radius="var(--radius-xl)" />
      </AppShell>
    );
  }

  // "A-102, Silver Arc, Thaltej, Ahmedabad – 380054, Gujarat"
  const address = [
    business.addressLine,
    [business.city, business.postalCode].filter(Boolean).join(' – '),
    business.state,
  ]
    .filter(Boolean)
    .join(', ');

  const contact = [
    { icon: <Phone size={20} aria-hidden="true" />, label: 'Phone', value: business.phone },
    { icon: <Mail size={20} aria-hidden="true" />, label: 'Email', value: business.email },
    { icon: <MapPin size={20} aria-hidden="true" />, label: 'Address', value: address },
  ];

  const isStore = business.type === 'STORE';

  // A store manages products & pickup orders (no time slots); a service manages
  // bookable services with hours/calendar.
  const sections: { id: BusinessTab; label: string; icon: JSX.Element }[] = [
    { id: 'overview', label: 'Overview', icon: <Home size={18} aria-hidden="true" /> },
    isStore
      ? { id: 'products', label: 'Products', icon: <Package size={18} aria-hidden="true" /> }
      : { id: 'services', label: 'Services', icon: <Scissors size={18} aria-hidden="true" /> },
    ...(isStore
      ? [{ id: 'stock' as const, label: 'Manage stock', icon: <Boxes size={18} aria-hidden="true" /> }]
      : []),
    { id: 'coupons', label: 'Offers', icon: <Tag size={18} aria-hidden="true" /> },
    {
      id: 'bookings',
      label: isStore ? 'Orders' : 'Bookings',
      icon: <CalendarDays size={18} aria-hidden="true" />,
    },
    { id: 'photos', label: 'Photos', icon: <ImageIcon size={18} aria-hidden="true" /> },
    // Weekly hours + break time is its own tab; per-date overrides (mark a day
    // closed, see that date's bookings/orders) is Calendar — both tabs for
    // every business type, store included.
    { id: 'hours', label: 'Hours', icon: <Clock size={18} aria-hidden="true" /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar size={18} aria-hidden="true" /> },
  ];

  const editLink = (
    <ModernCardLink onClick={goToEdit} iconLeft={<Pencil size={14} aria-hidden="true" />}>
      Edit
    </ModernCardLink>
  );

  const contactCard = (
    <ModernCard
      icon={<MapPin size={22} aria-hidden="true" />}
      iconTone="ink"
      title="Contact & Location"
      action={editLink}
    >
      <dl className={styles.infoGrid}>
        {contact.map((item) => (
          <div className={styles.infoItem} key={item.label}>
            <span className={styles.infoIcon}>{item.icon}</span>
            <dt className={styles.infoLabel}>{item.label}</dt>
            <dd className={styles.infoValue} title={item.value || undefined}>
              {item.value || <span className={styles.muted}>Not added</span>}
            </dd>
          </div>
        ))}
      </dl>
    </ModernCard>
  );

  const aboutContent = business.description ? (
    <p className={styles.about}>{business.description}</p>
  ) : (
    <p className={styles.muted}>
      No description yet. A short paragraph about {isStore ? 'your store' : 'what you do'} helps
      customers choose you.
    </p>
  );

  /* The sticky top bar is now just a plain breadcrumb + the usual
     notification/profile controls — the business's own identity (image,
     name, rating, category, Edit/Delete) is a large block in the page body
     instead, not squeezed into the slim sticky bar. */
  const detailHeader = (
    <>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link to="/businesses" className={styles.breadcrumbLink}>
          My Businesses
        </Link>
        <ChevronRight size={14} className={styles.breadcrumbSep} aria-hidden="true" />
        <span className={styles.breadcrumbCurrent}>{business.businessName}</span>
      </nav>

      <div className={shellStyles.topbarActions}>
        <NotificationBell />
        <Link
          className={`${shellStyles.topbarProfile} ${styles.profileChip}`}
          to="/profile"
          aria-label="Your profile"
        >
          <span className={shellStyles.topbarAvatar} aria-hidden="true">
            {initialsOf(user?.fullName ?? 'DNX')}
          </span>
          {user?.fullName && <span className={styles.topbarName}>{user.fullName}</span>}
          <ChevronDown size={16} aria-hidden="true" className={styles.topbarChevron} />
        </Link>
      </div>
    </>
  );

  /* The large business-identity block — image, name, rating, category, and
     the Edit/Delete actions — sits at the top of the page content itself
     (not the sticky bar), matching the commissioned mockup's proportions. */
  const bizHero = (
    <div className={styles.bizHero}>
      <div className={styles.bizHeroIdentity}>
        <div className={styles.bizHeroMedia}>
          {business.images.length > 0 ? (
            <img className={styles.bizHeroImg} src={business.images[0]} alt="" />
          ) : (
            <span className={styles.bizHeroFallback}>
              <CategoryIcon slug={business.category.slug} size={36} strokeWidth={1.6} />
            </span>
          )}
        </div>
        <div className={styles.bizHeroInfo}>
          <span className={styles.bizHeroNameRow}>
            <h1 className={styles.bizHeroName}>{business.businessName}</h1>
            {business.isVerified && (
              <BadgeCheck className={styles.verifiedIcon} size={30} aria-label="Verified" />
            )}
          </span>
          <span className={styles.bizHeroMetaRow}>
            <span className={styles.rating}>
              <Star size={20} className={styles.ratingStar} aria-hidden="true" />
              <strong>{business.ratingAvg.toFixed(1)}</strong>
              <span className={styles.ratingCount}>({business.ratingCount} reviews)</span>
            </span>
            <span className={styles.bizHeroDivider} aria-hidden="true" />
            <span className={styles.categoryTag}>
              <Tag size={15} aria-hidden="true" />
              {business.subcategory?.name ?? business.category.name}
            </span>
            {!business.isVerified && (
              <span className={styles.headerPending}>Verification pending</span>
            )}
          </span>
        </div>
      </div>
      <div className={styles.bizHeroActions}>
        <button type="button" className={`${styles.heroBtn} ${styles.heroBtnEdit}`} onClick={goToEdit}>
          <Pencil size={18} aria-hidden="true" />
          Edit Business
        </button>
        <button
          type="button"
          className={`${styles.heroBtn} ${styles.heroBtnDelete}`}
          onClick={() => setConfirmingDelete(true)}
        >
          <Trash2 size={18} aria-hidden="true" />
          Delete Business
        </button>
      </div>
    </div>
  );

  return (
    <AppShell header={detailHeader}>
      {bizHero}

      {/* Restrictions DNX has put on this business — the owner should always see why. */}
      {business.isBlocked && !blockedBannerDismissed && (
        <div className={`${styles.banner} ${styles.bannerError}`} role="alert">
          <Ban size={22} className={styles.bannerIcon} aria-hidden="true" />
          <p className={styles.bannerText}>
            <strong>This business is blocked by the platform.</strong>
            {business.blockedReason ? ` Reason${reasonSentence(business.blockedReason)}` : ''} Customers
            can't see it or place new bookings and orders. You can still finish anything already open.
          </p>
          <button
            type="button"
            className={styles.bannerDismiss}
            onClick={() => setBlockedBannerDismissed(true)}
            aria-label="Dismiss"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      )}
      {business.codDisabledByAdmin && !codBannerDismissed && (
        <div className={`${styles.banner} ${styles.bannerWarning}`} role="alert">
          <AlertTriangle size={22} className={styles.bannerIcon} aria-hidden="true" />
          <p className={styles.bannerText}>
            <strong>Cash on Delivery is disabled for this business.</strong>
            {business.codDisabledReason ? ` Reason${reasonSentence(business.codDisabledReason)}` : ''}{' '}
            Customers can only pay online or with a partial deposit.
          </p>
          <button
            type="button"
            className={styles.bannerDismiss}
            onClick={() => setCodBannerDismissed(true)}
            aria-label="Dismiss"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Section tabs — icon + label, blue underline on the active one. */}
      <div className={styles.tabs} role="tablist">
        {sections.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview — row 1: Earnings / (About + Busiest Day) / Contact;
          row 2: Top Sellers / Upcoming Appointments (service only) / Reviews. */}
      {activeTab === 'overview' && (
        <>
          <div className={styles.overviewRow}>
            <EarningsPanel providerId={business.id} businessType={isStore ? 'STORE' : 'SERVICE'} />
            <div className={styles.aboutCell}>
              <div className={styles.aboutStack}>
              <ModernCard
                icon={<FileText size={22} aria-hidden="true" />}
                iconTone="ink"
                title="About"
                action={editLink}
                className={styles.aboutCard}
              >
                {aboutContent}
              </ModernCard>
              {sellers.busiestDay && (
                <div className={styles.busiestCard}>
                  <Calendar size={26} aria-hidden="true" className={styles.busiestIcon} />
                  <div className={styles.busiestMain}>
                    <span className={styles.busiestLabel}>Busiest Day</span>
                    <span className={styles.busiestDay}>{sellers.busiestDay}</span>
                  </div>
                  {sellers.busiestAvg !== null && (
                    <span className={styles.busiestAvg}>
                      ({sellers.busiestAvg} {isStore ? 'orders' : 'bookings'} on avg.)
                    </span>
                  )}
                </div>
              )}
              </div>
            </div>
            {contactCard}
          </div>

          <div className={isStore ? styles.overviewRowTwo : styles.overviewRow}>
            <TopSellersPanel
              providerId={business.id}
              businessType={isStore ? 'STORE' : 'SERVICE'}
            />
            {!isStore && (
              <UpcomingAppointments
                providerId={business.id}
                onViewAll={() => setActiveTab('bookings')}
              />
            )}
            <RecentReviews providerId={business.id} limit={2} onViewAll={goToReviews} />
          </div>
        </>
      )}

      {/* Services (service businesses) */}
      {activeTab === 'services' && (
        <ServicesManager
          providerId={business.id}
          services={business.services}
          subcategorySlug={business.subcategory?.slug}
          businessPartialPayEnabled={business.partialPayEnabled}
        />
      )}

      {/* Products (store businesses) */}
      {activeTab === 'products' && (
        <ProductsManager
          providerId={business.id}
          products={business.products ?? []}
          subcategorySlug={business.subcategory?.slug}
          businessCodEnabled={business.codEnabled}
          businessPartialPayEnabled={business.partialPayEnabled}
        />
      )}

      {/* Manage stock (store businesses) */}
      {activeTab === 'stock' && (
        <StockManager providerId={business.id} products={business.products ?? []} />
      )}

      {/* Offers / coupons (any business type) */}
      {activeTab === 'coupons' && (
        <CouponsManager
          providerId={business.id}
          businessType={business.type ?? 'SERVICE'}
          services={business.services}
          products={business.products}
        />
      )}

      {/* Bookings / Orders */}
      {activeTab === 'bookings' &&
        (isStore ? (
          <OrdersManager providerId={business.id} />
        ) : (
          <BusinessBookings providerId={business.id} />
        ))}

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
                accept="image/jpeg,image/png,image/webp"
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
                  <div className={styles.galleryOverlay}>
                    {i !== 0 && (
                      <button
                        type="button"
                        className={styles.galleryBtn}
                        disabled={savingImages}
                        onClick={() => setCover(url)}
                      >
                        <Star size={13} aria-hidden="true" />
                        Set cover
                      </button>
                    )}
                    <button
                      type="button"
                      className={`${styles.galleryBtn} ${styles.galleryBtnDanger}`}
                      disabled={savingImages}
                      onClick={() => removeImage(url)}
                      aria-label="Remove photo"
                    >
                      <Trash2 size={13} aria-hidden="true" />
                      Remove
                    </button>
                  </div>
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

      {/* Weekly hours + break time — every business type. */}
      {activeTab === 'hours' && (
        <BusinessHours providerId={business.id} hours={business.businessHours} />
      )}

      {/* Calendar: per-date overrides (mark a day closed) + that date's
          bookings (service) or orders (store) — every business type. */}
      {activeTab === 'calendar' && (
        <BusinessCalendar
          providerId={business.id}
          businessHours={business.businessHours}
          businessType={business.type}
        />
      )}

      {confirmingDelete && (
        <div className={styles.deleteOverlay} role="dialog" aria-modal="true">
          <div className={styles.deleteModal}>
            <h3 className={styles.deleteTitle}>Delete “{business.businessName}”?</h3>
            <p className={styles.deleteText}>
              This permanently removes the business along with all its bookings, reviews, services
              and hours. This can’t be undone.
            </p>
            <div className={styles.deleteActions}>
              <Button
                variant="ghost"
                onClick={() => setConfirmingDelete(false)}
                disabled={deleting}
              >
                Keep business
              </Button>
              <Button onClick={remove} loading={deleting} loadingText="Deleting…">
                Delete business
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
