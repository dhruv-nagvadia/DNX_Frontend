import { ReactNode } from 'react';
import { IndianRupee, Percent, ShieldCheck, Store, Ticket, Users } from 'lucide-react';

import { LogoMark } from '@/components/AppShell/AppShell';
// Reuses the provider AuthSplitLayout's split-screen styles (navy brand
// panel, centred pitch + feature rows + tilted preview cards, pale form
// panel, responsive collapse) so the admin login looks like the same product.
// The component itself isn't reused because its copy is provider-specific;
// admin-only code stays physically separate from the provider auth screens.
import split from '@/pages/auth/AuthSplitLayout/AuthSplitLayout.module.css';
import styles from './AdminAuthLayout.module.css';

interface AdminAuthLayoutProps {
  children: ReactNode;
}

const FEATURES = [
  { icon: Users, text: 'Providers & users, verified and managed' },
  { icon: IndianRupee, text: 'Payments, commission and payouts' },
  { icon: Ticket, text: 'Platform-wide coupons & offers' },
] as const;

/** Decorative cards under the feature rows — illustrate the console's areas, no real data. */
function PreviewCards() {
  return (
    <div className={split.cards} aria-hidden="true">
      <div className={`${split.statCard} ${split.cardLeft}`}>
        <div className={split.cardHead}>
          <Store size={16} className={split.cardHeadIcon} />
          <span>Providers &amp; users</span>
        </div>
        <div className={split.cardBody}>
          <div>
            <div className={styles.cardStrong}>Verify</div>
            <span className={split.trendPill}>Active</span>
          </div>
          <svg className={split.spark} viewBox="0 0 100 50" preserveAspectRatio="none">
            <defs>
              <linearGradient id="adminLoginSparkBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#3B82F6" stopOpacity="0.22" />
                <stop offset="1" stopColor="#3B82F6" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M2 44 C12 42 18 34 28 34 S40 38 48 28 S62 18 70 22 S84 22 90 12 L98 6 L98 50 L2 50 Z"
              fill="url(#adminLoginSparkBlue)"
            />
            <path
              d="M2 44 C12 42 18 34 28 34 S40 38 48 28 S62 18 70 22 S84 22 90 12 L98 6"
              fill="none"
              stroke="#60A5FA"
              strokeWidth="2.5"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
      </div>

      <div className={`${split.statCard} ${split.cardMid}`}>
        <div className={split.ratingRow}>
          <span className={styles.shieldDot}>
            <ShieldCheck size={18} strokeWidth={2.25} />
          </span>
          <span className={styles.cardStrong}>Secure</span>
        </div>
        <div className={split.cardMuted}>Admins only</div>
        <div className={styles.cardChips}>
          <span className={styles.chip}>
            <Ticket size={12} strokeWidth={2.25} />
            Coupons
          </span>
        </div>
      </div>

      <div className={`${split.statCard} ${split.cardRight}`}>
        <div className={split.moneyRow}>
          <span className={split.rupeeDot}>
            <Percent size={14} strokeWidth={2.5} />
          </span>
          <span className={split.moneyNum}>Commission</span>
        </div>
        <div className={split.cardMuted}>Payments &amp; payouts</div>
        <span className={`${split.trendPill} ${split.trendPillSmall}`}>Tracked</span>
        <svg className={split.sparkWide} viewBox="0 0 170 44" preserveAspectRatio="none">
          <defs>
            <linearGradient id="adminLoginSparkGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#34D399" stopOpacity="0.32" />
              <stop offset="1" stopColor="#34D399" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M2 36 C14 32 22 30 34 32 S52 34 62 28 S80 20 92 26 S112 34 124 24 S146 8 168 8 L168 44 L2 44 Z"
            fill="url(#adminLoginSparkGreen)"
          />
          <path
            d="M2 36 C14 32 22 30 34 32 S52 34 62 28 S80 20 92 26 S112 34 124 24 S146 8 168 8"
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

/** Split-screen shell for the unlisted admin console's login page. */
export function AdminAuthLayout({ children }: AdminAuthLayoutProps) {
  return (
    <div className={split.page}>
      <aside className={split.brandPanel}>
        <div className={split.brandInner}>
          <div className={split.brand}>
            <LogoMark className={`${split.mark} ${styles.mark}`} />
            <span className={split.brandDivider} aria-hidden="true" />
            <span className={split.brandText}>
              <span className={split.brandName}>DNX Marketplace</span>
              <span className={split.brandSub}>Admin Console</span>
            </span>
          </div>

          <div className={split.pitch}>
            <h1 className={split.headline}>
              Run the marketplace,
              <br />
              all in one place
            </h1>
            <p className={split.subhead}>
              Internal console for managing DNX itself — providers, customers, payments and
              offers.
            </p>

            <ul className={split.features}>
              {FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className={split.feature}>
                  <span className={split.featureIcon} aria-hidden="true">
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

      <main className={split.formPanel}>
        <div className={split.formWrap}>
          {children}

          <p className={split.legal}>
            <ShieldCheck size={14} aria-hidden="true" />
            Restricted access
            <span aria-hidden="true">·</span>© {new Date().getFullYear()} DNX
          </p>
        </div>
      </main>
    </div>
  );
}
