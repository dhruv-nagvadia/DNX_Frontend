import {
  ArrowLeft,
  ArrowRight,
  Ban,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Command,
  Mail,
  MapPin,
  Phone,
  Receipt,
  ShieldCheck,
  Star,
  Store,
} from 'lucide-react';
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { AlertBanner } from '@/components/AlertBanner';
import { Button } from '@/components/Button';
import { FormDialog } from '@/components/FormDialog';
import { EmptyState } from '@/components/EmptyState';
import { ModernCard } from '@/components/ModernCard';
import { Pill } from '@/components/Pill';
import { Skeleton } from '@/components/Skeleton';
import { AdminProviderBusiness } from '@/redux/api/admin/types';
import { formatMoney } from '@/utils/money';
import { ReasonAction, useAdminProviderDetail } from './useAdminProviderDetail';
// Generic field/label/form styling shared across provider/admin forms.
import styles from '@/components/ServicesManager/ServicesManager.module.css';
import local from './AdminProviderDetail.module.css';

const dateFmt = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

function openWork(b: AdminProviderBusiness): string {
  const parts: string[] = [];
  if (b.openBookings > 0)
    parts.push(`${b.openBookings} open booking${b.openBookings === 1 ? '' : 's'}`);
  if (b.openOrders > 0) parts.push(`${b.openOrders} open order${b.openOrders === 1 ? '' : 's'}`);
  return parts.join(' · ');
}

/** What the confirm dialog says for each action that needs a reason. */
function describe(a: ReasonAction, openCount: number, otherBusinesses: number) {
  const open =
    openCount > 0
      ? `${openCount} booking/order${openCount === 1 ? ' is' : 's are'} still open. `
      : '';
  switch (a.kind) {
    case 'BLOCK_ACCOUNT':
      return {
        title: 'Block this provider account?',
        body: `They won't be able to log in, and ${
          otherBusinesses === 1 ? 'their business' : `all ${otherBusinesses} of their businesses`
        } will disappear from the customer app. ${open}Anything still open can't be finished by them while blocked — settle it yourself first if you can.`,
        confirm: 'Block account',
        placeholder: 'e.g. Repeated payment delays.',
      };
    case 'BLOCK_BUSINESS':
      return {
        title: `Block ${a.business.businessName}?`,
        body: `It disappears from the customer app and takes no new bookings or orders. The owner can still log in and finish what's already open. ${open}`,
        confirm: 'Block business',
        placeholder: 'e.g. Customer complaints about delayed orders.',
      };
    default:
      return {
        title: `Turn off Cash on Delivery for ${a.business.businessName}?`,
        body: "Customers can only pay online or with a partial deposit there, and the owner can't turn it back on themselves.",
        confirm: 'Turn off COD',
        placeholder: 'e.g. Cash collected but not remitted.',
      };
  }
}

function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}

function FactTile({
  tone,
  icon,
  label,
  value,
}: {
  tone: 'blue' | 'mint' | 'peach' | 'pink' | 'lavender';
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className={`${local.tile} ${local[`tile_${tone}`]}`}>
      <span className={local.tileIcon} aria-hidden="true">
        {icon}
      </span>
      <div className={local.tileText}>
        <span className={local.tileLabel}>{label}</span>
        <span className={local.tileValue}>{value}</span>
      </div>
    </div>
  );
}

/** One provider: block the account, or block / restrict each of their businesses. */
export function AdminProviderDetail({ userId }: { userId: string }) {
  const p = useAdminProviderDetail(userId);

  const backLink = (
    <Link to="/admin/providers" className={local.back}>
      <ArrowLeft size={16} aria-hidden="true" />
      All providers
    </Link>
  );

  if (p.isLoading || !p.data) {
    return (
      <div className={local.root} aria-busy="true" aria-label="Loading provider">
        {backLink}
        <Skeleton height={140} radius="var(--m-radius-card)" />
        <div className={local.tiles}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={78} radius="var(--m-radius-box)" />
          ))}
        </div>
        <Skeleton height={220} radius="var(--m-radius-card)" />
      </div>
    );
  }

  const { user, businesses, balanceMinor } = p.data;
  const dialog = p.action
    ? describe(
        p.action,
        p.action.kind === 'BLOCK_ACCOUNT'
          ? businesses.reduce((n, b) => n + b.openBookings + b.openOrders, 0)
          : p.action.business.openBookings + p.action.business.openOrders,
        businesses.length,
      )
    : null;
  const openTotal = businesses.reduce((n, b) => n + b.openBookings + b.openOrders, 0);
  const blockedCount = businesses.filter((b) => b.isBlocked).length;
  const balanceTone = balanceMinor > 0 ? 'mint' : balanceMinor < 0 ? 'pink' : 'blue';

  return (
    <div className={local.root}>
      {backLink}

      <section className={local.hero} aria-label="Provider">
        <div className={local.heroMain}>
          <span
            className={`${local.heroAvatar} ${user.isBlocked ? local.heroAvatarBlocked : ''}`}
            aria-hidden="true"
          >
            {initialsOf(user.fullName)}
          </span>
          <div className={local.heroText}>
            <div className={local.heroTitleRow}>
              <h1 className={local.heroName}>{user.fullName}</h1>
              {user.isBlocked ? (
                <Pill tone="red">
                  <Ban size={13} aria-hidden="true" />
                  Account blocked
                </Pill>
              ) : (
                <Pill tone="green">
                  <CheckCircle2 size={13} aria-hidden="true" />
                  Active
                </Pill>
              )}
            </div>
            <ul className={local.facts}>
              <li>
                <Mail size={15} aria-hidden="true" />
                {user.email}
              </li>
              <li>
                <Phone size={15} aria-hidden="true" />
                {user.phone ?? 'No phone'}
              </li>
              <li>
                <CalendarDays size={15} aria-hidden="true" />
                Joined {dateFmt.format(new Date(user.createdAt))}
              </li>
            </ul>
          </div>
        </div>
        <div className={local.heroActions}>
          {user.isBlocked ? (
            <Button
              variant="secondary"
              loading={p.busy === 'account'}
              iconLeft={<ShieldCheck size={16} aria-hidden="true" />}
              onClick={p.unblockAccount}
            >
              Unblock account
            </Button>
          ) : (
            <Button
              variant="secondary"
              iconLeft={<Ban size={16} aria-hidden="true" />}
              onClick={() => p.open({ kind: 'BLOCK_ACCOUNT' })}
            >
              Block account
            </Button>
          )}
        </div>

        {user.isBlocked && (
          <div className={local.heroNote}>
            <AlertBanner tone="error">
              Account blocked{user.blockedReason ? `: ${user.blockedReason}` : '.'} They can't log
              in and none of their businesses are shown to customers.
            </AlertBanner>
          </div>
        )}
        {p.error && !p.action && (
          <div className={local.heroNote}>
            <AlertBanner tone="error">{p.error}</AlertBanner>
          </div>
        )}
      </section>

      <div className={local.tiles}>
        <FactTile
          tone="blue"
          icon={<Store size={20} />}
          label="Businesses"
          value={businesses.length}
        />
        <FactTile
          tone="pink"
          icon={<Ban size={20} />}
          label="Blocked businesses"
          value={blockedCount}
        />
        <FactTile
          tone="peach"
          icon={<ClipboardList size={20} />}
          label="Open bookings / orders"
          value={openTotal}
        />
        <FactTile
          tone={balanceTone}
          icon={<Banknote size={20} />}
          label={
            balanceMinor === 0 ? 'Balance' : balanceMinor > 0 ? 'You owe them' : 'They owe you'
          }
          value={
            balanceMinor === 0 ? (
              <span className={local.tileValueSm}>Nothing owed either way</span>
            ) : (
              formatMoney(Math.abs(balanceMinor))
            )
          }
        />
      </div>

      <ModernCard
        icon={<Store size={20} aria-hidden="true" />}
        title="Businesses"
        suffix={`(${businesses.length})`}
      >
        {businesses.length === 0 ? (
          <EmptyState
            icon={<Store size={28} strokeWidth={1.6} aria-hidden="true" />}
            title="No businesses"
            description="This provider hasn't added a business yet."
          />
        ) : (
          <ul className={local.list}>
            {businesses.map((b) => {
              const work = openWork(b);
              const isStore = b.type === 'STORE';
              return (
                <li key={b.id} className={`${local.biz} ${b.isBlocked ? local.bizBlocked : ''}`}>
                  <div className={local.bizHead}>
                    <span
                      className={`${local.bizIcon} ${isStore ? local.bizIconStore : local.bizIconService}`}
                      aria-hidden="true"
                    >
                      {isStore ? <Store size={20} /> : <Command size={20} />}
                    </span>
                    <div className={local.bizText}>
                      <h3 className={local.bizName}>{b.businessName}</h3>
                      <div className={local.bizMeta}>
                        <Pill tone={isStore ? 'blue' : 'lavender'}>
                          {isStore ? 'Store' : 'Service business'}
                        </Pill>
                        {b.city && (
                          <span className={local.metaItem}>
                            <MapPin size={14} aria-hidden="true" />
                            {b.city}
                          </span>
                        )}
                        {b.ratingCount > 0 && (
                          <span className={local.metaItem}>
                            <Star size={14} className={local.star} aria-hidden="true" />
                            <strong>{b.ratingAvg.toFixed(1)}</strong>
                            <span className={local.muted}>({b.ratingCount})</span>
                          </span>
                        )}
                        {work && (
                          <span className={local.metaItem}>
                            <ClipboardList size={14} aria-hidden="true" />
                            {work}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={local.badges}>
                      {b.isBlocked ? (
                        <Pill tone="red">Blocked</Pill>
                      ) : (
                        b.isActive && <Pill tone="green">Active</Pill>
                      )}
                      {b.codDisabledByAdmin ? (
                        <Pill tone="yellow">COD off (by you)</Pill>
                      ) : (
                        !b.codEnabled && <Pill tone="grey">COD off (by owner)</Pill>
                      )}
                      {!b.isActive && <Pill tone="grey">Inactive</Pill>}
                    </div>
                  </div>

                  {b.isBlocked && b.blockedReason && (
                    <AlertBanner tone="error">Blocked: {b.blockedReason}</AlertBanner>
                  )}
                  {b.codDisabledByAdmin && b.codDisabledReason && (
                    <AlertBanner tone="error">COD turned off: {b.codDisabledReason}</AlertBanner>
                  )}

                  <div className={local.bizActions}>
                    {b.isBlocked ? (
                      <Button
                        variant="secondary"
                        loading={p.busy === b.id}
                        iconLeft={<ShieldCheck size={16} aria-hidden="true" />}
                        onClick={p.unblockBusiness(b.id)}
                      >
                        Unblock business
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        iconLeft={<Ban size={16} aria-hidden="true" />}
                        onClick={() => p.open({ kind: 'BLOCK_BUSINESS', business: b })}
                      >
                        Block business
                      </Button>
                    )}
                    {b.codDisabledByAdmin ? (
                      <Button
                        variant="secondary"
                        loading={p.busy === `cod-${b.id}`}
                        iconLeft={<Banknote size={16} aria-hidden="true" />}
                        onClick={p.enableCod(b.id)}
                      >
                        Turn COD back on
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        iconLeft={<Banknote size={16} aria-hidden="true" />}
                        onClick={() => p.open({ kind: 'COD_OFF', business: b })}
                      >
                        Turn off COD
                      </Button>
                    )}
                    <Link
                      to={`/admin/transactions?businessId=${b.id}&range=all`}
                      className={local.txLink}
                    >
                      <Receipt size={16} aria-hidden="true" />
                      Transactions
                      <ArrowRight size={15} aria-hidden="true" />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </ModernCard>

      <FormDialog
        open={!!(p.action && dialog)}
        size="sm"
        tone="danger"
        title={dialog?.title ?? ''}
        onClose={p.close}
        onSubmit={(e) => {
          e.preventDefault();
          void p.confirm();
        }}
        error={p.error}
        submitLabel={dialog?.confirm ?? ''}
        submitting={p.busy === 'modal'}
        submittingLabel="Applying…"
        initialFocus="firstField"
      >
        {dialog && <p className={local.warn}>{dialog.body}</p>}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="providerReason">
            Reason <span className={styles.optional}>(optional — the provider can see it)</span>
          </label>
          <textarea
            id="providerReason"
            className={styles.textarea}
            placeholder={dialog?.placeholder}
            value={p.reason}
            onChange={(e) => p.setReason(e.target.value)}
            maxLength={300}
          />
        </div>
      </FormDialog>
    </div>
  );
}
