import { ReactNode, useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Coins,
  FileText,
  HelpCircle,
  Lightbulb,
  Mail,
  MessageCircle,
  Percent,
  Phone,
  Search,
} from 'lucide-react';

import { AppShell } from '@/components/AppShell';
import { NotificationBell } from '@/components/NotificationBell';
import { useAppSelector } from '@/redux/hooks';
import { SUPPORT, supportLinks } from '@/utils/support';

import { HelpIllustration } from './HelpIllustration';
import {
  EMAIL_REPLY_TIME,
  FAQ_CATEGORIES,
  FAQS,
  FaqCategory,
  SUPPORT_HOURS,
  WHATSAPP_NOTE,
  answerText,
} from './supportContent';
import styles from './SupportPage.module.css';

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'D';
}

const QUICK_LINKS: { to: string; label: string; icon: ReactNode; tone: string }[] = [
  { to: '/earnings', label: 'Earnings & payouts', icon: <Coins size={20} />, tone: styles.qlGreen },
  { to: '/earnings', label: 'Commission rates', icon: <Percent size={20} />, tone: styles.qlOrange },
  { to: '/businesses', label: 'Business verification', icon: <BadgeCheck size={20} />, tone: styles.qlBlue },
  { to: '/terms', label: 'Terms & privacy', icon: <FileText size={20} />, tone: styles.qlLavender },
];

/**
 * Help centre: searchable FAQ plus direct, always-visible ways to reach DNX
 * support — no ticket/chat-only dead end when something goes wrong mid-job.
 */
export default function SupportPage() {
  const user = useAppSelector((s) => s.user.currentUser);
  const fullName = user?.fullName ?? '';
  const avatarUrl = user?.avatarUrl ?? null;

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<FaqCategory | 'all'>('all');
  const [openId, setOpenId] = useState<string | null>(FAQS[0]?.id ?? null);
  const baseId = useId();

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;
  const activeCategory = searching ? 'all' : category;

  const visible = useMemo(
    () =>
      FAQS.filter((f) => {
        if (activeCategory !== 'all' && f.category !== activeCategory) return false;
        if (!q) return true;
        return (f.question + ' ' + answerText(f.answer)).toLowerCase().includes(q);
      }),
    [activeCategory, q],
  );

  const header = (
    <div className={styles.topBar}>
      <div className={styles.titleBlock}>
        <h1 className={styles.title}>Help &amp; Support</h1>
        <p className={styles.subtitle}>
          Get help, find answers, or contact the DNX support team.
        </p>
      </div>
      <div className={styles.topControls}>
        <div className={styles.bellWrap}>
          <NotificationBell />
        </div>
        <Link className={styles.profileChip} to="/profile">
          {avatarUrl ? (
            <img className={styles.profileAvatarImg} src={avatarUrl} alt="" aria-hidden="true" />
          ) : (
            <span className={styles.profileAvatar} aria-hidden="true">
              {initialsOf(fullName || 'DNX')}
            </span>
          )}
          <span className={styles.profileName}>{fullName || 'Your account'}</span>
          <ChevronDown size={16} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );

  return (
    <AppShell header={header}>
      <div className={styles.page}>
        {/* ── Hero ── */}
        <section className={styles.hero} aria-labelledby={`${baseId}-hero`}>
          <HelpIllustration className={styles.heroArt} />
          <span className={styles.heroDivider} aria-hidden="true" />
          <div className={styles.heroBody}>
            <h2 id={`${baseId}-hero`} className={styles.heroTitle}>
              How can we help?
            </h2>
            <p className={styles.heroText}>
              Something wrong on a job, a payment issue, or anything else — reach us directly.
            </p>
            <label className={styles.search}>
              <Search size={22} aria-hidden="true" className={styles.searchIcon} />
              <input
                type="search"
                className={styles.searchInput}
                placeholder="Search help articles..."
                aria-label="Search help articles"
                value={query}
                onChange={(ev) => setQuery(ev.target.value)}
              />
            </label>
          </div>
        </section>

        {/* ── Contact cards ── */}
        <div className={styles.contactRow}>
          <div className={styles.contactCard}>
            <span className={`${styles.contactIcon} ${styles.iconCall}`} aria-hidden="true">
              <Phone size={26} />
            </span>
            <div className={styles.contactText}>
              <h3 className={styles.contactTitle}>Call us</h3>
              <span className={styles.contactValue}>{SUPPORT.phoneDisplay}</span>
              <span className={styles.contactMeta}>{SUPPORT_HOURS}</span>
            </div>
            <a className={`${styles.contactBtn} ${styles.btnBlue}`} href={supportLinks.call}>
              Call now
            </a>
          </div>

          <div className={styles.contactCard}>
            <span className={`${styles.contactIcon} ${styles.iconWhatsapp}`} aria-hidden="true">
              <MessageCircle size={26} />
            </span>
            <div className={styles.contactText}>
              <h3 className={styles.contactTitle}>WhatsApp us</h3>
              <span className={styles.contactMeta}>{WHATSAPP_NOTE}</span>
            </div>
            <a
              className={`${styles.contactBtn} ${styles.btnGreen}`}
              href={supportLinks.whatsapp}
              target="_blank"
              rel="noreferrer"
            >
              Open WhatsApp
            </a>
          </div>

          <div className={styles.contactCard}>
            <span className={`${styles.contactIcon} ${styles.iconEmail}`} aria-hidden="true">
              <Mail size={26} />
            </span>
            <div className={styles.contactText}>
              <h3 className={styles.contactTitle}>Email us</h3>
              <span className={`${styles.contactValue} ${styles.contactEmail}`}>
                {SUPPORT.email}
              </span>
              <span className={styles.contactMeta}>{EMAIL_REPLY_TIME}</span>
            </div>
            <a className={`${styles.contactBtn} ${styles.btnOutline}`} href={supportLinks.email}>
              Send email
            </a>
          </div>
        </div>

        {/* ── FAQ + side column ── */}
        <div className={styles.mainGrid}>
          <section className={styles.card} aria-labelledby={`${baseId}-faq`}>
            <h2 id={`${baseId}-faq`} className={styles.cardTitle}>
              Frequently asked questions
            </h2>

            <div className={styles.chips} role="group" aria-label="FAQ category">
              {FAQ_CATEGORIES.map((c) => {
                const active = activeCategory === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={active}
                    className={`${styles.chip} ${active ? styles.chipActive : ''}`}
                    onClick={() => {
                      setQuery('');
                      setCategory(c.id);
                    }}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>

            {visible.length === 0 ? (
              <p className={styles.empty}>No answers match — contact us below.</p>
            ) : (
              <ul className={styles.faqList}>
                {visible.map((f) => {
                  const open = openId === f.id;
                  const panelId = `${baseId}-${f.id}-panel`;
                  const btnId = `${baseId}-${f.id}-btn`;
                  return (
                    <li key={f.id} className={`${styles.faqItem} ${open ? styles.faqOpen : ''}`}>
                      <h3 className={styles.faqHeading}>
                        <button
                          id={btnId}
                          type="button"
                          className={styles.faqBtn}
                          aria-expanded={open}
                          aria-controls={panelId}
                          onClick={() => setOpenId(open ? null : f.id)}
                        >
                          <HelpCircle size={22} aria-hidden="true" className={styles.faqIcon} />
                          <span className={styles.faqQ}>{f.question}</span>
                          {open ? (
                            <ChevronUp size={20} aria-hidden="true" className={styles.faqChevron} />
                          ) : (
                            <ChevronDown size={20} aria-hidden="true" className={styles.faqChevron} />
                          )}
                        </button>
                      </h3>
                      <div
                        id={panelId}
                        role="region"
                        aria-labelledby={btnId}
                        className={styles.faqPanel}
                        hidden={!open}
                      >
                        <p>
                          {f.answer.map((part, i) =>
                            typeof part === 'string' ? (
                              <span key={i}>{part}</span>
                            ) : (
                              <Link key={i} to={part.to} className={styles.faqLink}>
                                {part.label}
                              </Link>
                            ),
                          )}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <div className={styles.side}>
            <section className={styles.card} aria-labelledby={`${baseId}-ql`}>
              <h2 id={`${baseId}-ql`} className={styles.cardTitle}>
                Quick links
              </h2>
              <ul className={styles.qlList}>
                {QUICK_LINKS.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className={styles.qlRow}>
                      <span className={`${styles.qlIcon} ${l.tone}`} aria-hidden="true">
                        {l.icon}
                      </span>
                      <span className={styles.qlLabel}>{l.label}</span>
                      <ChevronRight size={20} aria-hidden="true" className={styles.qlChevron} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <aside className={styles.tip}>
              <Lightbulb size={30} aria-hidden="true" className={styles.tipIcon} />
              <p className={styles.tipText}>
                <strong className={styles.tipTitle}>Before contacting us:</strong>
                keep your booking/order ID handy (e.g. #B7K2Q9) so we can help faster.
              </p>
            </aside>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
