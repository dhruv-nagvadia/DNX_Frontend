import type { ReactNode } from 'react';
import { CalendarDays, IndianRupee, Star, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

import styles from './AuthSplitLayout.module.css';

const FEATURES = [
  // SERVICES-ONLY: store/order copy disabled for launch — restore the commented original: 'Bookings & orders in real time'
  { icon: CalendarDays, text: 'Bookings in real time' },
  { icon: TrendingUp, text: 'Track earnings and payouts' },
  { icon: Star, text: 'Offers and reviews that grow your business' },
] as const;

/** DNX brand mark — a person with a round head and an "X" body. */
function BrandMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <circle cx="35" cy="11" r="9" fill="#2563EB" />
      <path
        d="M10 22 L52 56 M52 22 L10 56"
        stroke="#2563EB"
        strokeWidth="13"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/** Decorative stat cards under the feature rows in the brand panel (not real data). */
function PreviewCards() {
  return (
    <div className={styles.cards} aria-hidden="true">
      <div className={`${styles.statCard} ${styles.cardLeft}`}>
        <div className={styles.cardHead}>
          <CalendarDays size={16} className={styles.cardHeadIcon} />
          <span>Today&apos;s bookings</span>
        </div>
        <div className={styles.cardBody}>
          <div>
            <div className={styles.bigNum}>12</div>
            <span className={styles.trendPill}>↑ 20%</span>
          </div>
          <svg className={styles.spark} viewBox="0 0 100 50" preserveAspectRatio="none">
            <defs>
              <linearGradient id="loginSparkBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#3B82F6" stopOpacity="0.22" />
                <stop offset="1" stopColor="#3B82F6" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M2 46 C12 44 16 30 26 32 S38 40 46 30 S60 14 68 24 S82 30 88 14 L98 4 L98 50 L2 50 Z"
              fill="url(#loginSparkBlue)"
            />
            <path
              d="M2 46 C12 44 16 30 26 32 S38 40 46 30 S60 14 68 24 S82 30 88 14 L98 4"
              fill="none"
              stroke="#60A5FA"
              strokeWidth="2.5"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
      </div>

      <div className={`${styles.statCard} ${styles.cardMid}`}>
        <div className={styles.ratingRow}>
          <Star size={24} className={styles.starBig} />
          <span className={styles.ratingNum}>4.7</span>
        </div>
        <div className={styles.stars}>
          {[0, 1, 2, 3].map((i) => (
            <Star key={i} size={16} className={styles.starFull} />
          ))}
          <span className={styles.starHalfWrap}>
            <Star size={16} className={styles.starEmpty} />
            <span className={styles.starHalf}>
              <Star size={16} className={styles.starFull} />
            </span>
          </span>
        </div>
        <div className={styles.cardMuted}>526 reviews</div>
      </div>

      <div className={`${styles.statCard} ${styles.cardRight}`}>
        <div className={styles.moneyRow}>
          <span className={styles.rupeeDot}>
            <IndianRupee size={14} strokeWidth={2.5} />
          </span>
          <span className={styles.moneyNum}>₹24,580</span>
        </div>
        <div className={styles.cardMuted}>This month</div>
        <span className={`${styles.trendPill} ${styles.trendPillSmall}`}>↑ 12%</span>
        <svg className={styles.sparkWide} viewBox="0 0 170 44" preserveAspectRatio="none">
          <defs>
            <linearGradient id="loginSparkGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#34D399" stopOpacity="0.32" />
              <stop offset="1" stopColor="#34D399" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M2 34 C14 30 22 26 34 30 S52 36 62 30 S80 22 92 30 S112 40 124 30 S146 6 168 6 L168 44 L2 44 Z"
            fill="url(#loginSparkGreen)"
          />
          <path
            d="M2 34 C14 30 22 26 34 30 S52 36 62 30 S80 22 92 30 S112 40 124 30 S146 6 168 6"
            fill="none"
            stroke="#34D399"
            strokeWidth="2.5"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    </div>
  );
}

export interface AuthSplitLayoutProps {
  /** Big white headline in the brand panel. */
  headline: ReactNode;
  /** Supporting line under the headline. */
  subhead: ReactNode;
  /** The card (usually a <form className={card.card}>). */
  children: ReactNode;
}

/**
 * Split-screen shell shared by the provider auth pages: navy brand panel on
 * the left, pale form panel with the card and Terms · Privacy on the right.
 */
export function AuthSplitLayout({ headline, subhead, children }: AuthSplitLayoutProps) {
  return (
    <div className={styles.page}>
      <aside className={styles.brandPanel}>
        <div className={styles.brandInner}>
          <div className={styles.brand}>
            <BrandMark className={styles.mark} />
            <span className={styles.brandDivider} aria-hidden="true" />
            <span className={styles.brandText}>
              <span className={styles.brandName}>DNX Marketplace</span>
              <span className={styles.brandSub}>Provider Portal</span>
            </span>
          </div>

          <div className={styles.pitch}>
            <h1 className={styles.headline}>{headline}</h1>
            <p className={styles.subhead}>{subhead}</p>

            <ul className={styles.features}>
              {FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className={styles.feature}>
                  <span className={styles.featureIcon} aria-hidden="true">
                    <Icon size={18} strokeWidth={2} />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <PreviewCards />
        </div>
      </aside>

      <main className={styles.formPanel}>
        <div className={styles.formWrap}>
          {children}

          <nav className={styles.legal} aria-label="Legal">
            <Link to="/terms">Terms</Link>
            <span aria-hidden="true">·</span>
            <Link to="/privacy">Privacy</Link>
          </nav>
        </div>
      </main>
    </div>
  );
}
