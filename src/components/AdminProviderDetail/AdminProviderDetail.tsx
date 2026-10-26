import { ArrowLeft, Ban, Banknote, Receipt, ShieldCheck, Store } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { AlertBanner } from '@/components/AlertBanner';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import { AdminProviderBusiness } from '@/redux/api/admin/types';
import { formatMoney } from '@/utils/money';
import { ReasonAction, useAdminProviderDetail } from './useAdminProviderDetail';
// Generic field/label/form styling shared across provider/admin forms.
import styles from '@/components/ServicesManager/ServicesManager.module.css';
// Header, overlay and modal styles shared with the customer detail screen.
import shared from '@/components/AdminUserDetail/AdminUserDetail.module.css';
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

/** One provider: block the account, or block / restrict each of their businesses. */
export function AdminProviderDetail({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const p = useAdminProviderDetail(userId);

  if (p.isLoading || !p.data) {
    return (
      <Card title="Provider">
        <Skeleton height={80} radius="var(--radius-md)" />
      </Card>
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

  return (
    <>
      <Button
        variant="ghost"
        iconLeft={<ArrowLeft size={16} aria-hidden="true" />}
        onClick={() => navigate('/admin/providers')}
      >
        Back to providers
      </Button>

      <Card title="Provider">
        <div className={shared.header}>
          <div>
            <div className={shared.name}>{user.fullName}</div>
            <div className={shared.meta}>
              {user.email} · {user.phone ?? 'No phone'} · Joined{' '}
              {dateFmt.format(new Date(user.createdAt))}
            </div>
            <div
              className={local.balance}
              style={{
                color:
                  balanceMinor > 0
                    ? 'var(--color-success)'
                    : balanceMinor < 0
                      ? 'var(--color-error)'
                      : 'var(--color-text-secondary)',
              }}
            >
              <Banknote
                size={14}
                aria-hidden="true"
                style={{ verticalAlign: '-2px', marginRight: 4 }}
              />
              {balanceMinor === 0
                ? 'Nothing owed either way'
                : balanceMinor > 0
                  ? `You owe them ${formatMoney(balanceMinor)}`
                  : `They owe you ${formatMoney(-balanceMinor)}`}
            </div>
          </div>
          <div className={shared.actions}>
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
        </div>

        {user.isBlocked && (
          <div className={shared.blockedNote}>
            <AlertBanner tone="error">
              Account blocked{user.blockedReason ? `: ${user.blockedReason}` : '.'} They can't log
              in and none of their businesses are shown to customers.
            </AlertBanner>
          </div>
        )}
        {p.error && !p.action && (
          <div className={shared.blockedNote}>
            <AlertBanner tone="error">{p.error}</AlertBanner>
          </div>
        )}
      </Card>

      <Card title="Businesses">
        {businesses.length === 0 ? (
          <EmptyState
            icon={<Store size={28} strokeWidth={1.6} aria-hidden="true" />}
            title="No businesses"
            description="This provider hasn't added a business yet."
          />
        ) : (
          <div className={local.list}>
            {businesses.map((b) => {
              const work = openWork(b);
              return (
                <div key={b.id} className={`${local.biz} ${b.isBlocked ? local.bizBlocked : ''}`}>
                  <div className={local.bizHead}>
                    <div>
                      <div className={local.bizName}>{b.businessName}</div>
                      <div className={shared.meta}>
                        {b.type === 'STORE' ? 'Store' : 'Service business'}
                        {b.city ? ` · ${b.city}` : ''}
                        {b.ratingCount > 0
                          ? ` · ★ ${b.ratingAvg.toFixed(1)} (${b.ratingCount})`
                          : ''}
                        {work ? ` · ${work}` : ''}
                      </div>
                    </div>
                    <div className={local.badges}>
                      {b.isBlocked && <Badge tone="error">Blocked</Badge>}
                      {b.codDisabledByAdmin ? (
                        <Badge tone="warning">COD off (by you)</Badge>
                      ) : (
                        !b.codEnabled && <Badge tone="neutral">COD off (by owner)</Badge>
                      )}
                      {!b.isActive && <Badge tone="neutral">Inactive</Badge>}
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
                        onClick={p.enableCod(b.id)}
                      >
                        Turn COD back on
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        onClick={() => p.open({ kind: 'COD_OFF', business: b })}
                      >
                        Turn off COD
                      </Button>
                    )}
                    <Link to={`/admin/transactions?businessId=${b.id}&range=all`}>
                      <Button variant="ghost" iconLeft={<Receipt size={16} aria-hidden="true" />}>
                        Transactions
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {p.action && dialog && (
        <div className={shared.overlay} role="dialog" aria-modal="true">
          <div className={shared.modal}>
            <h3 className={shared.modalTitle}>{dialog.title}</h3>
            <p className={local.warn}>{dialog.body}</p>
            <label className={styles.label} htmlFor="providerReason">
              Reason <span className={styles.optional}>(optional — the provider can see it)</span>
            </label>
            <textarea
              id="providerReason"
              className={styles.textarea}
              placeholder={dialog.placeholder}
              value={p.reason}
              onChange={(e) => p.setReason(e.target.value)}
              maxLength={300}
            />
            {p.error && <AlertBanner tone="error">{p.error}</AlertBanner>}
            <div className={styles.formActions}>
              <Button variant="secondary" onClick={p.close} disabled={p.busy === 'modal'}>
                Cancel
              </Button>
              <Button loading={p.busy === 'modal'} loadingText="Applying…" onClick={p.confirm}>
                {dialog.confirm}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
