import {
  ArrowRight,
  BadgeCheck,
  Bell,
  CalendarCheck,
  ChartColumn,
  Check,
  Clock,
  MapPin,
  MessageSquareReply,
  // Package, // SERVICES-ONLY: unused while store copy is hidden — uncomment to restore
  // Pill, // SERVICES-ONLY: unused while store copy is hidden — uncomment to restore
  Scissors,
  Search,
  // ShoppingBasket, // SERVICES-ONLY: unused while store copy is hidden — uncomment to restore
  Smartphone,
  Sparkles,
  SprayCan,
  Star,
  Store,
  Tag,
  Wallet,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { CategoryIcon } from '@/components/CategoryIcon';
import { Skeleton } from '@/components/Skeleton';

import { SiteFooter, SiteNav, type SiteNavSection } from './SiteChrome';
import { useHomePage } from './useHomePage';
import styles from './HomePage.module.css';

const SECTIONS: SiteNavSection[] = [
  { id: 'how-it-works', label: 'How it works' },
  { id: 'features', label: 'Features' },
  { id: 'categories', label: 'Categories' },
  { id: 'for-businesses', label: 'For businesses' },
];

const STEPS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Search,
    title: 'Find someone nearby',
    // SERVICES-ONLY: store/order copy disabled for launch — restore the commented original: 'Browse categories or search for a service or store, filtered by rating, distance and who’s open now.',
    body: 'Browse categories or search for a service, filtered by rating, distance and who’s open now.',
  },
  {
    icon: CalendarCheck,
    // SERVICES-ONLY: store/order copy disabled for launch — restore the commented original:
    // title: 'Book or order',
    // body: 'Pick a time slot for a service, or add products to your cart and place an order with the store.',
    title: 'Book a slot',
    body: 'Pick a service and a free time slot that suits you.',
  },
  {
    icon: BadgeCheck,
    // SERVICES-ONLY: store/order copy disabled for launch — restore the commented original:
    // title: 'Show up or pick up',
    // body: 'Get a confirmation and reminders, visit at your time or collect your order, then leave a review.',
    title: 'Show up',
    body: 'Get a confirmation and reminders, visit at your time, then leave a review.',
  },
];

type Feature = { icon: LucideIcon; title: string; body: string };

const CUSTOMER_FEATURES: Feature[] = [
  // SERVICES-ONLY: store/order copy disabled for launch — restore the commented original:
  // { icon: MapPin, title: 'Nearby businesses', body: 'See salons, clinics, repair pros and stores close to you.' },
  { icon: MapPin, title: 'Nearby businesses', body: 'See salons, clinics and repair pros close to you.' },
  { icon: Clock, title: 'Book in a few taps', body: 'Choose a service and a free slot — no calls needed.' },
  // SERVICES-ONLY: store/order copy disabled for launch — restore the commented original:
  // { icon: ShoppingBasket, title: 'Order from local stores', body: 'Shop neighbourhood stores and pick up when it’s ready.' },
  { icon: Star, title: 'Ratings & reviews', body: 'See what other customers say before you book.' },
  { icon: Tag, title: 'Offers & coupons', body: 'Apply coupons from businesses at checkout.' },
];

const BUSINESS_FEATURES: Feature[] = [
  // SERVICES-ONLY: store/order copy disabled for launch — restore the commented original:
  // { icon: Bell, title: 'Bookings & orders in real time', body: 'Every new booking and order lands in one dashboard.' },
  // { icon: Package, title: 'Services, products & stock', body: 'Manage your menu, prices and inventory in one place.' },
  { icon: Bell, title: 'Bookings in real time', body: 'Every new booking lands in one dashboard.' },
  { icon: CalendarCheck, title: 'Services & hours', body: 'Manage your services, prices and hours in one place.' },
  { icon: Wallet, title: 'Earnings & payouts', body: 'Track what you’ve earned and what’s been paid out.' },
  { icon: MessageSquareReply, title: 'Reviews & offers', body: 'Reply to reviews and run coupons that bring people back.' },
];

/** Shown only if the category list can't be loaded — a static, non-interactive preview. */
const FALLBACK_CATEGORIES: { icon: LucideIcon; name: string }[] = [
  { icon: Scissors, name: 'Salon' },
  { icon: Sparkles, name: 'Spa' },
  // SERVICES-ONLY: store/order copy disabled for launch — restore the commented original:
  // { icon: ShoppingBasket, name: 'Grocery' },
  // { icon: Pill, name: 'Pharmacy' },
  { icon: Wrench, name: 'Repairs' },
  { icon: SprayCan, name: 'Cleaning' },
];

const TINTS = [styles.tintBlue, styles.tintLavender, styles.tintPeach, styles.tintPink, styles.tintMint];
const tintAt = (i: number) => TINTS[i % TINTS.length];

/** Decorative tilted preview cards in the hero's brand panel (illustrative only, no data). */
function HeroPreview() {
  return (
    <div className={styles.heroPanel} aria-hidden="true">
      <span className={styles.nearChip}>
        <MapPin size={14} strokeWidth={2.25} />
        Near you
      </span>

      <div className={styles.previewCards}>
        <div className={`${styles.pCard} ${styles.pCardLeft}`}>
          <div className={styles.pHead}>
            <span className={`${styles.pIcon} ${styles.pIconBlue}`}>
              <Scissors size={16} strokeWidth={2} />
            </span>
            <span className={styles.pHeadText}>
              <span className={styles.pTitle}>Haircut &amp; styling</span>
              <span className={styles.pSub}>Salon appointment</span>
            </span>
          </div>
          <div className={styles.slots}>
            <span className={styles.slot}>Morning</span>
            <span className={`${styles.slot} ${styles.slotActive}`}>Afternoon</span>
            <span className={styles.slot}>Evening</span>
          </div>
          <span className={`${styles.pPill} ${styles.pPillGreen}`}>
            <Check size={12} strokeWidth={3} />
            Confirmed
          </span>
        </div>

        <div className={`${styles.pCard} ${styles.pCardMid}`}>
          <div className={styles.pHead}>
            <span className={`${styles.pIcon} ${styles.pIconMint}`}>
              {/* SERVICES-ONLY: store/order copy disabled for launch — restore the commented original: <ShoppingBasket size={16} strokeWidth={2} /> */}
              <Sparkles size={16} strokeWidth={2} />
            </span>
            <span className={styles.pHeadText}>
              {/* SERVICES-ONLY: store/order copy disabled for launch — restore the commented original:
              <span className={styles.pTitle}>Store order</span>
              <span className={styles.pSub}>Neighbourhood grocery</span>
              */}
              <span className={styles.pTitle}>Spa session</span>
              <span className={styles.pSub}>Booking request</span>
            </span>
          </div>
          <ul className={styles.items}>
            {[72, 56, 64].map((w) => (
              <li key={w} className={styles.item}>
                <span className={styles.tick}>
                  <Check size={10} strokeWidth={3.5} />
                </span>
                <span className={styles.bar} style={{ width: `${w}%` }} />
              </li>
            ))}
          </ul>
          {/* SERVICES-ONLY: store/order copy disabled for launch — restore the commented original: <span className={`${styles.pPill} ${styles.pPillOrange}`}>Ready for pickup</span> */}
          <span className={`${styles.pPill} ${styles.pPillOrange}`}>Accepted</span>
        </div>

        <div className={`${styles.pCard} ${styles.pCardRight}`}>
          <div className={styles.starsRow}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} size={16} className={styles.star} />
            ))}
          </div>
          <span className={styles.pTitle}>Loved by locals</span>
          <span className={styles.bar} style={{ width: '90%' }} />
          <span className={styles.bar} style={{ width: '64%' }} />
          <span className={`${styles.pPill} ${styles.pPillBlue}`}>
            <MessageSquareReply size={12} strokeWidth={2.25} />
            Owner replied
          </span>
        </div>
      </div>
    </div>
  );
}

function FeatureList({ items }: { items: Feature[] }) {
  return (
    <ul className={styles.featureList}>
      {items.map(({ icon: Icon, title, body }) => (
        <li key={title} className={styles.featureItem}>
          <span className={styles.featureIcon} aria-hidden="true">
            <Icon size={18} strokeWidth={2} />
          </span>
          <span>
            <span className={styles.featureTitle}>{title}</span>
            <span className={styles.featureBody}>{body}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Landing page at "/": what DNX is for customers and for businesses.
 *
 * The customer experience ships as the mobile app, so this page explains the
 * platform, shows the live category list, and funnels businesses into the
 * provider portal (signed-in customers can list a business with the same
 * account).
 */
export default function HomePage() {
  const { userName, listBusinessHref, categories, isLoading, onCategoryClick } = useHomePage();

  return (
    <div className={styles.page}>
      <SiteNav sections={SECTIONS} />

      <main id="main" tabIndex={-1} className={styles.main}>
        {/* ── Hero ── */}
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>
              <Sparkles size={14} strokeWidth={2.25} aria-hidden="true" />
              {/* SERVICES-ONLY: store/order copy disabled for launch — restore the commented original: 'Local services & stores, in one place' */}
              {userName ? `Hi, ${userName}` : 'Local services, in one place'}
            </span>
            {/* SERVICES-ONLY: store/order copy disabled for launch — restore the commented original:
            <h1 id="hero-title" className={styles.heroTitle}>
              Book local services. <span className={styles.heroAccent}>Order from nearby stores.</span>
            </h1>
            <p className={styles.heroSub}>
              DNX connects you with salons, clinics, repair pros and neighbourhood stores near
              you — book a time slot or place an order in a few taps.
            </p>
            */}
            <h1 id="hero-title" className={styles.heroTitle}>
              Book local services. <span className={styles.heroAccent}>In just a few taps.</span>
            </h1>
            <p className={styles.heroSub}>
              DNX connects you with salons, clinics, repair pros and other local services near
              you — book a time slot in a few taps.
            </p>
            <div className={styles.heroCtas}>
              <a className={`${styles.btn} ${styles.btnSolid}`} href="#categories">
                Browse categories
                <ArrowRight size={16} strokeWidth={2.25} aria-hidden="true" />
              </a>
              <Link className={`${styles.btn} ${styles.btnGhost}`} to={listBusinessHref}>
                <Store size={16} strokeWidth={2} aria-hidden="true" />
                List your business
              </Link>
            </div>
            <p className={styles.heroNote}>
              <Smartphone size={15} strokeWidth={2} aria-hidden="true" />
              {/* SERVICES-ONLY: store/order copy disabled for launch — restore the commented original: Customers book and order on the DNX mobile app. */}
              Customers book on the DNX mobile app.
            </p>
          </div>

          <HeroPreview />
        </section>

        {/* ── How it works ── */}
        <section id="how-it-works" className={styles.section} aria-labelledby="how-title">
          <div className={styles.sectionHead}>
            <span className={styles.kicker}>How it works</span>
            <h2 id="how-title" className={styles.sectionTitle}>
              From search to sorted in three steps
            </h2>
          </div>
          <ol className={styles.steps}>
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className={styles.step}>
                <div className={styles.stepTop}>
                  <span className={`${styles.stepIcon} ${tintAt(i)}`} aria-hidden="true">
                    <Icon size={20} strokeWidth={2} />
                  </span>
                  <span className={styles.stepNum} aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <h3 className={styles.stepTitle}>
                  <span className={styles.srOnly}>Step {i + 1}: </span>
                  {title}
                </h3>
                <p className={styles.stepBody}>{body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Customers vs businesses ── */}
        <section id="features" className={styles.section} aria-labelledby="features-title">
          <div className={styles.sectionHead}>
            <span className={styles.kicker}>Features</span>
            <h2 id="features-title" className={styles.sectionTitle}>
              Built for both sides of the counter
            </h2>
          </div>
          <div className={styles.audience}>
            <article className={styles.audienceCard} aria-labelledby="for-customers-title">
              <div className={styles.audienceHead}>
                <span className={`${styles.audienceIcon} ${styles.tintBlue}`} aria-hidden="true">
                  <Smartphone size={20} strokeWidth={2} />
                </span>
                <div>
                  <h3 id="for-customers-title" className={styles.audienceTitle}>
                    For customers
                  </h3>
                  <p className={styles.audienceSub}>On the DNX mobile app</p>
                </div>
              </div>
              <FeatureList items={CUSTOMER_FEATURES} />
            </article>

            <article className={styles.audienceCard} aria-labelledby="for-businesses-title">
              <div className={styles.audienceHead}>
                <span className={`${styles.audienceIcon} ${styles.tintLavender}`} aria-hidden="true">
                  <ChartColumn size={20} strokeWidth={2} />
                </span>
                <div>
                  <h3 id="for-businesses-title" className={styles.audienceTitle}>
                    For businesses
                  </h3>
                  <p className={styles.audienceSub}>In the web provider portal</p>
                </div>
              </div>
              <FeatureList items={BUSINESS_FEATURES} />
            </article>
          </div>
        </section>

        {/* ── Categories ── */}
        <section id="categories" className={styles.section} aria-labelledby="categories-title">
          <div className={styles.sectionHead}>
            <span className={styles.kicker}>Categories</span>
            <h2 id="categories-title" className={styles.sectionTitle}>
              What do you need today?
            </h2>
            <p className={styles.sectionSub}>Pick a category to browse providers near you.</p>
          </div>

          {isLoading ? (
            <div className={styles.catGrid}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} height={112} radius="var(--m-radius-card)" />
              ))}
            </div>
          ) : categories.length > 0 ? (
            <ul className={styles.catGrid}>
              {categories.map((category, i) => (
                <li key={category.id}>
                  <button
                    type="button"
                    className={`${styles.catTile} ${tintAt(i)}`}
                    onClick={() => onCategoryClick(category)}
                  >
                    <span className={styles.catIcon} aria-hidden="true">
                      <CategoryIcon slug={category.slug} size={22} strokeWidth={1.8} />
                    </span>
                    <span className={styles.catName}>{category.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <ul className={styles.catGrid}>
              {FALLBACK_CATEGORIES.map(({ icon: Icon, name }, i) => (
                <li key={name}>
                  <span className={`${styles.catTile} ${styles.catTileStatic} ${tintAt(i)}`}>
                    <span className={styles.catIcon} aria-hidden="true">
                      <Icon size={22} strokeWidth={1.8} />
                    </span>
                    <span className={styles.catName}>{name}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── Business CTA band ── */}
        <section id="for-businesses" className={styles.ctaWrap} aria-labelledby="cta-title">
          <div className={styles.ctaBand}>
            <div className={styles.ctaCopy}>
              <h2 id="cta-title" className={styles.ctaTitle}>
                Run a business?
              </h2>
              <p className={styles.ctaBody}>
                {/* SERVICES-ONLY: store/order copy disabled for launch — restore the commented original: List it on DNX and start taking bookings and orders from customers nearby. */}
                List it on DNX and start taking bookings from customers nearby.
                {userName ? ' Use this same account — no need to register again.' : ''}
              </p>
            </div>
            <div className={styles.ctaActions}>
              <Link className={`${styles.btn} ${styles.btnWhite}`} to={listBusinessHref}>
                List your business
                <ArrowRight size={16} strokeWidth={2.25} aria-hidden="true" />
              </Link>
              {!userName && (
                <Link className={`${styles.btn} ${styles.btnOnDark}`} to="/login">
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
