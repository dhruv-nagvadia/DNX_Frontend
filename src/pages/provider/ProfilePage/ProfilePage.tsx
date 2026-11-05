import { ReactNode, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Ban,
  Bell,
  Box,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Command,
  FileText,
  HelpCircle,
  Lock,
  LogOut,
  Mail,
  Pencil,
  Phone,
  Star,
  Store,
  Sun,
  Trash2,
  User,
  Users,
} from 'lucide-react';

import { AppShell } from '@/components/AppShell';
import { CategoryIcon } from '@/components/CategoryIcon';
import { NotificationBell } from '@/components/NotificationBell';
import { Pill } from '@/components/Pill';
import { Skeleton } from '@/components/Skeleton';
import { Provider } from '@/redux/api/provider/types';

import { ChangePasswordDialog, DeleteAccountDialog } from './ProfileDialogs';
import { AccountField, AppearanceMode, useProfilePage } from './useProfilePage';
import styles from './ProfilePage.module.css';

function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || 'DN'
  );
}

const monthYear = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' });

function providerSince(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : `Provider since ${monthYear.format(d)}`;
}

const FIELDS: { key: AccountField; label: string; icon: ReactNode; type: string; autoComplete: string }[] = [
  { key: 'fullName', label: 'Full name', icon: <User size={20} />, type: 'text', autoComplete: 'name' },
  { key: 'email', label: 'Email', icon: <Mail size={20} />, type: 'email', autoComplete: 'email' },
  { key: 'phone', label: 'Phone', icon: <Phone size={20} />, type: 'tel', autoComplete: 'tel' },
];

const APPEARANCE: { value: AppearanceMode; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

function StatusPill({ b }: { b: Provider }) {
  if (b.isBlocked) {
    return (
      <Pill tone="red" className={styles.statusPill}>
        <Ban size={15} aria-hidden="true" />
        Blocked
      </Pill>
    );
  }
  if (b.isVerified) {
    return (
      <Pill tone="green" className={styles.statusPill}>
        <CheckCircle2 size={15} aria-hidden="true" />
        Verified
      </Pill>
    );
  }
  return (
    <Pill tone="orange" className={styles.statusPill}>
      <Clock size={15} aria-hidden="true" />
      Pending
    </Pill>
  );
}

/** A tappable settings row: icon, title + grey hint, chevron. */
function NavRow({
  icon,
  title,
  hint,
  onClick,
  to,
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
  onClick?: () => void;
  to?: string;
}) {
  const body = (
    <>
      <span className={styles.rowIcon} aria-hidden="true">
        {icon}
      </span>
      <span className={styles.rowText}>
        <span className={styles.rowTitle}>{title}</span>
        {hint && <span className={styles.rowHint}>{hint}</span>}
      </span>
      <ChevronRight size={20} className={styles.rowChevron} aria-hidden="true" />
    </>
  );
  return to ? (
    <Link to={to} className={styles.navRow}>
      {body}
    </Link>
  ) : (
    <button type="button" className={styles.navRow} onClick={onClick}>
      {body}
    </button>
  );
}

/** Provider account — identity, stats, account details, businesses, security & preferences. */
export default function ProfilePage() {
  const p = useProfilePage();
  const { user, stats, isLoading, businesses } = p;
  const name = user?.fullName || 'Your account';
  const since = providerSince(user?.createdAt);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const accountRef = useRef<HTMLElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const [pwOpen, setPwOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);

  useEffect(() => {
    if (!pwSuccess) return;
    const t = window.setTimeout(() => setPwSuccess(false), 4000);
    return () => window.clearTimeout(t);
  }, [pwSuccess]);

  const editProfile = () => {
    p.startEdit('fullName');
    accountRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  /** There's no standalone notifications page — open the top-bar bell's panel. */
  const openNotifications = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    bellRef.current?.querySelector('button')?.click();
  };

  const header = (
    <div className={styles.topBar}>
      <div className={styles.titleBlock}>
        <h1 className={styles.title}>Account / Profile</h1>
        <p className={styles.subtitle}>Manage your profile, account, businesses and preferences.</p>
      </div>
      <div className={styles.topControls}>
        <div className={styles.bellWrap} ref={bellRef}>
          <NotificationBell />
        </div>
        <Link className={styles.profileChip} to="/profile">
          {user?.avatarUrl ? (
            <img className={styles.chipAvatarImg} src={user.avatarUrl} alt="" aria-hidden="true" />
          ) : (
            <span className={styles.chipAvatar} aria-hidden="true">
              {initialsOf(name)}
            </span>
          )}
          <span className={styles.chipName}>{name}</span>
          <ChevronDown size={16} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );

  const tiles = [
    { label: 'Businesses', value: stats.businesses, icon: <Store size={26} />, tone: styles.tileBlue },
    { label: 'Services', value: stats.services, icon: <Command size={26} />, tone: styles.tileLavender },
    { label: 'Products', value: stats.products, icon: <Box size={26} />, tone: styles.tilePeach },
    {
      label: 'Avg rating',
      value:
        stats.avgRating == null ? (
          '—'
        ) : (
          <>
            <Star size={22} className={styles.goldStar} aria-hidden="true" />
            {stats.avgRating.toFixed(1)}
          </>
        ),
      icon: <Star size={26} />,
      tone: styles.tileMint,
    },
  ];

  return (
    <AppShell header={header}>
      <div className={styles.page}>
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className={styles.hero} aria-label="Profile">
          <div className={styles.banner} aria-hidden="true" />
          <div className={styles.heroBody}>
            <div className={styles.avatarWrap}>
              {user?.avatarUrl ? (
                <img className={styles.avatarImg} src={user.avatarUrl} alt="" />
              ) : (
                <span className={styles.avatar} aria-hidden="true">
                  {initialsOf(name)}
                </span>
              )}
              <button
                type="button"
                className={styles.cameraBtn}
                onClick={() => photoInputRef.current?.click()}
                disabled={p.uploadingPhoto}
                aria-label="Change profile photo"
              >
                <Camera size={16} aria-hidden="true" />
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className={styles.hiddenInput}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void p.changePhoto(file);
                  e.target.value = '';
                }}
              />
            </div>
            <div className={styles.identity}>
              <h2 className={styles.name}>{name}</h2>
              {since && <span className={styles.since}>{since}</span>}
              <div className={styles.badges}>
                <Pill tone="lavender" className={styles.rolePill}>
                  <Users size={16} aria-hidden="true" />
                  Provider
                </Pill>
                {p.uploadingPhoto && <span className={styles.since}>Uploading photo…</span>}
              </div>
              {p.photoError && (
                <span className={styles.inlineError} role="alert">
                  {p.photoError}
                </span>
              )}
            </div>
            <button type="button" className={styles.editProfileBtn} onClick={editProfile}>
              <Pencil size={18} aria-hidden="true" />
              Edit profile
            </button>
          </div>
        </section>

        {/* ── Stat tiles ───────────────────────────────────────────── */}
        <div className={styles.tiles}>
          {tiles.map((t) => (
            <div key={t.label} className={`${styles.tile} ${t.tone}`}>
              <span className={styles.tileIcon} aria-hidden="true">
                {t.icon}
              </span>
              <div className={styles.tileText}>
                <span className={styles.tileLabel}>{t.label}</span>
                {isLoading ? (
                  <Skeleton width={48} height={28} />
                ) : (
                  <span className={styles.tileValue}>{t.value}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.columns}>
          {/* ── Left column ────────────────────────────────────────── */}
          <div className={styles.col}>
            <section className={styles.card} ref={accountRef} aria-labelledby="acct-h">
              <h2 id="acct-h" className={styles.cardTitle}>
                Account details
              </h2>
              <div className={styles.fieldList}>
                {FIELDS.map((f) => {
                  const editing = p.editingField === f.key;
                  const value = f.key === 'phone' ? user?.phone : user?.[f.key];
                  return (
                    <div key={f.key} className={styles.fieldRow}>
                      <span className={styles.fieldIcon} aria-hidden="true">
                        {f.icon}
                      </span>
                      <span className={styles.fieldLabel}>{f.label}</span>
                      {editing ? (
                        <form
                          className={styles.fieldEdit}
                          onSubmit={(e) => {
                            e.preventDefault();
                            void p.saveField();
                          }}
                          noValidate
                        >
                          <div className={styles.fieldInputWrap}>
                            <input
                              autoFocus
                              className={`${styles.fieldInput} ${p.fieldError ? styles.fieldInputError : ''}`}
                              type={f.type}
                              name={f.key}
                              autoComplete={f.autoComplete}
                              aria-label={f.label}
                              aria-invalid={!!p.fieldError}
                              value={p.draft}
                              onChange={(e) => p.onDraft(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') p.cancelEdit();
                              }}
                            />
                            {p.fieldError && (
                              <span className={styles.inlineError} role="alert">
                                {p.fieldError}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            className={styles.btnOutline}
                            onClick={p.cancelEdit}
                            disabled={p.saving}
                          >
                            Cancel
                          </button>
                          <button type="submit" className={styles.btnPrimary} disabled={p.saving}>
                            {p.saving ? 'Saving…' : 'Save'}
                          </button>
                        </form>
                      ) : (
                        <>
                          <span className={`${styles.fieldValue} ${value ? '' : styles.fieldEmpty}`}>
                            {value || 'Not added'}
                          </span>
                          <button
                            type="button"
                            className={styles.editLink}
                            onClick={() => p.startEdit(f.key)}
                            aria-label={`Edit ${f.label.toLowerCase()}`}
                          >
                            <Pencil size={16} aria-hidden="true" />
                            Edit
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className={styles.card} aria-labelledby="biz-h">
              <h2 id="biz-h" className={styles.cardTitle}>
                Your businesses
              </h2>
              {isLoading ? (
                <div className={styles.bizList}>
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} height={66} radius="var(--m-radius-box)" />
                  ))}
                </div>
              ) : businesses.length === 0 ? (
                <p className={styles.muted}>No businesses yet — add one to start taking bookings.</p>
              ) : (
                <div className={styles.bizList}>
                  {businesses.map((b) => (
                    <Link key={b.id} to={`/businesses/${b.id}`} className={styles.bizRow}>
                      <span className={styles.bizImg}>
                        {b.images.length > 0 ? (
                          <img src={b.images[0]} alt="" loading="lazy" />
                        ) : (
                          <CategoryIcon slug={b.category.slug} size={26} strokeWidth={1.5} />
                        )}
                      </span>
                      <span className={styles.bizText}>
                        <span className={styles.bizName}>{b.businessName}</span>
                        <span className={styles.bizMeta}>
                          {[b.subcategory?.name ?? b.category.name, b.city].filter(Boolean).join(' • ')}
                        </span>
                      </span>
                      <StatusPill b={b} />
                      <span className={styles.bizRating}>
                        <Star size={18} className={styles.goldStar} aria-hidden="true" />
                        {b.ratingCount > 0 ? b.ratingAvg.toFixed(1) : '—'}
                      </span>
                      <ChevronRight size={20} className={styles.rowChevron} aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              )}
              <Link to="/businesses" className={styles.footLink}>
                Manage businesses
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </section>
          </div>

          {/* ── Right column ───────────────────────────────────────── */}
          <div className={styles.col}>
            <section className={styles.card} aria-labelledby="sec-h">
              <h2 id="sec-h" className={styles.cardTitle}>
                Security
              </h2>
              <div className={styles.rowList}>
                <div className={styles.staticRow}>
                  <span className={styles.rowIcon} aria-hidden="true">
                    <Lock size={20} />
                  </span>
                  <span className={styles.rowText}>
                    <span className={styles.rowTitle}>Password</span>
                    {pwSuccess ? (
                      <span className={styles.rowSuccess} role="status">
                        <CheckCircle2 size={14} aria-hidden="true" />
                        Password updated
                      </span>
                    ) : (
                      <span className={styles.rowHint}>Change the password you sign in with</span>
                    )}
                  </span>
                  <button type="button" className={styles.btnOutlineSm} onClick={() => setPwOpen(true)}>
                    Change password
                  </button>
                </div>
                <NavRow icon={<LogOut size={20} />} title="Log out" onClick={p.logout} />
              </div>
            </section>

            <section className={styles.card} aria-labelledby="pref-h">
              <h2 id="pref-h" className={styles.cardTitle}>
                Preferences
              </h2>
              <div className={styles.rowList}>
                <div className={styles.staticRow}>
                  <span className={styles.rowIcon} aria-hidden="true">
                    <Sun size={20} />
                  </span>
                  <span className={styles.rowText}>
                    <span className={styles.rowTitle}>Appearance</span>
                  </span>
                  <div className={styles.segmented} role="radiogroup" aria-label="Appearance">
                    {APPEARANCE.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        role="radio"
                        aria-checked={p.appearance === o.value}
                        className={`${styles.segment} ${p.appearance === o.value ? styles.segmentActive : ''}`}
                        onClick={() => p.setAppearance(o.value)}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
                <NavRow
                  icon={<Bell size={20} />}
                  title="Notifications"
                  hint="Manage email, push and in-app notifications"
                  onClick={openNotifications}
                />
              </div>
            </section>

            <section className={styles.card} aria-labelledby="help-h">
              <h2 id="help-h" className={styles.cardTitle}>
                Help
              </h2>
              <div className={styles.rowList}>
                <NavRow
                  icon={<HelpCircle size={20} />}
                  title="Help & Support"
                  hint="Get help, raise a request or contact our team"
                  to="/support"
                />
                <NavRow
                  icon={<FileText size={20} />}
                  title="Terms & Privacy"
                  hint="Read our terms of service and privacy policy"
                  to="/terms"
                />
              </div>
            </section>

            <section className={`${styles.card} ${styles.danger}`} aria-labelledby="danger-h">
              <h2 id="danger-h" className={`${styles.cardTitle} ${styles.dangerTitle}`}>
                Danger zone
              </h2>
              <div className={styles.dangerRow}>
                <span className={styles.dangerIcon} aria-hidden="true">
                  <Trash2 size={20} />
                </span>
                <span className={styles.rowText}>
                  <span className={styles.rowTitle}>Delete account</span>
                  <span className={styles.rowHint}>
                    Permanently remove your provider account and businesses.
                  </span>
                </span>
                <button type="button" className={styles.btnDangerOutline} onClick={() => setDeleteOpen(true)}>
                  Delete account
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>

      {pwOpen && (
        <ChangePasswordDialog
          onClose={() => setPwOpen(false)}
          onSubmit={p.changePassword}
          submitting={p.changingPassword}
          onDone={() => {
            setPwOpen(false);
            setPwSuccess(true);
          }}
        />
      )}
      {deleteOpen && (
        <DeleteAccountDialog
          onClose={() => setDeleteOpen(false)}
          onSubmit={p.deleteAccount}
          submitting={p.deleting}
        />
      )}
    </AppShell>
  );
}
