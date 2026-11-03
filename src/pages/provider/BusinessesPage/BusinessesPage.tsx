import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Command,
  Package,
  Pencil,
  Plus,
  Search,
  Star,
  Store,
  Tag,
} from 'lucide-react';

import { AppShell } from '@/components/AppShell';
import { profileProgress } from '@/components/BusinessChecklist';
import { Button } from '@/components/Button';
import { CategoryIcon } from '@/components/CategoryIcon';
import { EmptyState } from '@/components/EmptyState';
import { NotificationBell } from '@/components/NotificationBell';
import { Pill } from '@/components/Pill';
import { Skeleton } from '@/components/Skeleton';
import { Provider } from '@/redux/api/provider/types';

import { TypeFilter, useBusinessesPage } from './useBusinessesPage';
import styles from './BusinessesPage.module.css';

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

/** Placeholder cards shown while the list loads. */
function LoadingGrid() {
  return (
    <div className={styles.grid} aria-busy="true" aria-label="Loading your businesses">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} height={430} radius="var(--m-radius-card)" />
      ))}
    </div>
  );
}

function SummaryTile({
  tone,
  icon,
  label,
  value,
}: {
  tone: 'blue' | 'mint' | 'peach' | 'pink';
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className={`${styles.tile} ${styles[`tile_${tone}`]}`}>
      <span className={styles.tileIcon}>{icon}</span>
      <div className={styles.tileText}>
        <span className={styles.tileLabel}>{label}</span>
        <span className={styles.tileValue}>{value}</span>
      </div>
    </div>
  );
}

function BusinessCard({
  biz,
  onOpen,
  onEdit,
}: {
  biz: Provider;
  onOpen: () => void;
  onEdit: () => void;
}) {
  const isStore = biz.type === 'STORE';
  const itemCount = isStore ? (biz.products?.length ?? 0) : biz.services.length;
  const itemLabel = isStore ? 'product' : 'service';
  const { pct, pending } = profileProgress(biz);
  const category = biz.subcategory?.name ?? biz.category.name;

  return (
    <article className={styles.card}>
      {/* One button covers the card so the whole tile is one target, keeping
          Edit / Manage as separate, non-nested controls above it. */}
      <button type="button" className={styles.openButton} onClick={onOpen}>
        <span className={styles.srOnly}>Open {biz.businessName}</span>
      </button>

      <div className={styles.cover}>
        {biz.images.length > 0 ? (
          <img className={styles.coverImg} src={biz.images[0]} alt="" loading="lazy" />
        ) : (
          <span className={styles.coverFallback}>
            <CategoryIcon slug={biz.category.slug} size={40} strokeWidth={1.5} />
          </span>
        )}
        <span className={`${styles.typePill} ${isStore ? styles.typeStore : styles.typeService}`}>
          {isStore ? <Store size={16} aria-hidden="true" /> : <Command size={16} aria-hidden="true" />}
          {isStore ? 'Store' : 'Service'}
        </span>
        <button
          type="button"
          className={styles.editBtn}
          onClick={onEdit}
          aria-label={`Edit ${biz.businessName}`}
        >
          <Pencil size={17} aria-hidden="true" />
        </button>
      </div>

      <div className={styles.body}>
        <h3 className={styles.name}>
          <span className={styles.nameText}>{biz.businessName}</span>
          {biz.isVerified && (
            <BadgeCheck className={styles.verified} size={26} aria-label="Verified" />
          )}
        </h3>
        <p className={styles.place}>
          <Tag size={16} aria-hidden="true" />
          {category}
          {biz.city && (
            <>
              <span className={styles.dot} aria-hidden="true">
                •
              </span>
              {biz.city}
            </>
          )}
        </p>
        <p className={styles.meta}>
          <Star size={18} className={styles.star} aria-hidden="true" />
          <strong>{biz.ratingAvg.toFixed(1)}</strong>
          <span className={styles.muted}>({biz.ratingCount} reviews)</span>
          <span className={styles.sep} aria-hidden="true" />
          {isStore ? <Package size={16} aria-hidden="true" /> : <Command size={16} aria-hidden="true" />}
          {itemCount} {itemLabel}
          {itemCount === 1 ? '' : 's'}
        </p>

        {biz.isBlocked ? (
          <p className={styles.blockedNote}>
            <AlertTriangle size={18} aria-hidden="true" />
            Blocked by platform – contact support
          </p>
        ) : (
          pending > 0 && (
            <div className={styles.progress}>
              <div className={styles.progressHead}>
                <span>
                  {pending} {pending === 1 ? 'step' : 'steps'} left to finish your profile
                </span>
                <span>{pct}%</span>
              </div>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        )}
      </div>

      <footer className={styles.footer}>
        {biz.isBlocked ? (
          <Pill tone="red">
            <Ban size={15} aria-hidden="true" />
            Blocked
          </Pill>
        ) : biz.isVerified ? (
          <Pill tone="green">
            <Check size={15} aria-hidden="true" />
            Verified
          </Pill>
        ) : (
          <Pill tone="orange">
            <Clock size={15} aria-hidden="true" />
            Pending
          </Pill>
        )}
        <button type="button" className={styles.manage} onClick={onOpen}>
          Manage
          <ArrowRight size={17} aria-hidden="true" />
        </button>
      </footer>
    </article>
  );
}

/** My Businesses — matches "DNX Marketplace Business Dashboard.png". */
export default function BusinessesPage() {
  const {
    userName,
    avatarUrl,
    businesses,
    visible,
    counts,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    isLoading,
    addBusiness,
    openBusiness,
    editBusiness,
  } = useBusinessesPage();

  return (
    <AppShell>
      <div className={styles.topRow}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>My Businesses</h1>
          <p className={styles.subtitle}>
            {businesses.length > 0
              ? 'Open a business to manage its services, products, hours and photos.'
              : 'Add a business so customers can discover and book you.'}
          </p>
        </div>
        <div className={styles.topActions}>
          {businesses.length > 0 && (
            <>
              <label className={styles.search}>
                <Search size={18} aria-hidden="true" />
                <input
                  type="search"
                  placeholder="Search businesses..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search businesses"
                />
              </label>
              <label className={styles.selectWrap}>
                <select
                  className={styles.select}
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                  aria-label="Filter by type"
                >
                  <option value="all">All types</option>
                  <option value="service">Services</option>
                  <option value="store">Stores</option>
                </select>
                <ChevronDown size={16} aria-hidden="true" className={styles.selectChevron} />
              </label>
              <button type="button" className={styles.addBtn} onClick={addBusiness}>
                <Plus size={18} aria-hidden="true" />
                Add Business
              </button>
            </>
          )}
          <div className={styles.bellWrap}>
            <NotificationBell />
          </div>
          <Link className={styles.profileChip} to="/profile">
            {avatarUrl ? (
              <img className={styles.avatar} src={avatarUrl} alt="" aria-hidden="true" />
            ) : (
              <span className={`${styles.avatar} ${styles.avatarInitials}`} aria-hidden="true">
                {initialsOf(userName || 'DNX')}
              </span>
            )}
            <span className={styles.profileName}>{userName || 'Your account'}</span>
            <ChevronDown size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>

      {isLoading ? (
        <LoadingGrid />
      ) : businesses.length === 0 ? (
        <EmptyState
          icon={<Store size={28} strokeWidth={1.6} aria-hidden="true" />}
          title="No businesses yet"
          description="Your first business takes a couple of minutes to set up — name, category and where you work. You can add services and photos afterwards."
          action={
            <Button onClick={addBusiness} iconLeft={<Plus size={18} aria-hidden="true" />}>
              Add your first business
            </Button>
          }
        />
      ) : (
        <>
          <div className={styles.tiles}>
            <SummaryTile tone="blue" icon={<Store size={26} />} label="Total Businesses" value={counts.total} />
            <SummaryTile tone="mint" icon={<CheckCircle2 size={28} />} label="Verified" value={counts.verified} />
            <SummaryTile
              tone="peach"
              icon={<Clock size={28} />}
              label="Pending Verification"
              value={counts.pending}
            />
            <SummaryTile
              tone="pink"
              icon={<AlertTriangle size={28} />}
              label="Needs Attention"
              value={counts.attention}
            />
          </div>

          {visible.length === 0 && (
            <p className={styles.noMatch}>No businesses match your search.</p>
          )}

          <div className={styles.grid}>
            {visible.map((biz) => (
              <BusinessCard
                key={biz.id}
                biz={biz}
                onOpen={() => openBusiness(biz.id)}
                onEdit={() => editBusiness(biz.id)}
              />
            ))}
            <button type="button" className={styles.addCard} onClick={addBusiness}>
              <Store size={44} strokeWidth={1.6} aria-hidden="true" className={styles.addCardIcon} />
              <span className={styles.addCardTitle}>
                <Plus size={22} aria-hidden="true" />
                Add a new business
              </span>
              <span className={styles.addCardSub}>Set up in a couple of minutes</span>
            </button>
          </div>
        </>
      )}
    </AppShell>
  );
}
