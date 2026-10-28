import { Ban, CreditCard, ShieldCheck } from 'lucide-react';

import { AlertBanner } from '@/components/AlertBanner';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Skeleton } from '@/components/Skeleton';
import { AdminUserDetailProps } from './types';
import { useAdminUserDetail } from './useAdminUserDetail';
// Generic field/label/form styling shared across provider/admin forms.
import styles from '@/components/ServicesManager/ServicesManager.module.css';
import local from './AdminUserDetail.module.css';

const dateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const money = (minor: number) => `₹${(minor / 100).toLocaleString('en-IN')}`;

export function AdminUserDetail({ userId }: AdminUserDetailProps) {
  const {
    data,
    isLoading,
    blockOpen,
    blockReason,
    setBlockReason,
    openBlock,
    closeBlock,
    confirmBlock,
    blocking,
    unblock,
    unblocking,
    toggleCod,
    togglingCod,
    chargeOpen,
    openCharge,
    closeCharge,
    amount,
    setAmount,
    reason,
    setReason,
    note,
    setNote,
    error,
    submitCharge,
    creatingPenalty,
    setPenaltyStatus,
  } = useAdminUserDetail(userId);

  if (isLoading || !data) {
    return (
      <Card title="Customer">
        <Skeleton height={80} radius="var(--radius-md)" />
      </Card>
    );
  }

  const { user, noShowBookings, noShowOrders, penalties } = data;
  const totalNoShows = noShowBookings.length + noShowOrders.length;

  return (
    <>
      <Card title="Customer">
        <div className={local.header}>
          <div>
            <div className={local.name}>{user.fullName}</div>
            <div className={local.meta}>
              {user.email} · {user.phone ?? 'No phone'} · Joined {dateFmt.format(new Date(user.createdAt))}
            </div>
            <div className={local.meta}>
              {totalNoShows} no-show{totalNoShows === 1 ? '' : 's'} on record
              {user.codDisabled && ' · Cash on Delivery disabled'}
              {user.isBlocked && ' · Account blocked'}
            </div>
          </div>
          <div className={local.actions}>
            {user.isBlocked ? (
              <Button variant="secondary" loading={unblocking} onClick={unblock}>
                Unblock account
              </Button>
            ) : (
              <Button
                variant="secondary"
                iconLeft={<Ban size={16} aria-hidden="true" />}
                onClick={openBlock}
              >
                Block account
              </Button>
            )}
            {user.codDisabled ? (
              <Button
                variant="secondary"
                loading={togglingCod}
                iconLeft={<ShieldCheck size={16} aria-hidden="true" />}
                onClick={() => toggleCod(false)}
              >
                Re-enable COD
              </Button>
            ) : (
              <Button
                variant="secondary"
                loading={togglingCod}
                onClick={() => toggleCod(true)}
              >
                Disable COD
              </Button>
            )}
            <Button iconLeft={<CreditCard size={16} aria-hidden="true" />} onClick={openCharge}>
              Add charge
            </Button>
          </div>
        </div>

        {user.isBlocked && user.blockedReason && (
          <div className={local.blockedNote}>
            <AlertBanner tone="error">Blocked: {user.blockedReason}</AlertBanner>
          </div>
        )}
      </Card>

      <Card title="No-show history">
        {totalNoShows === 0 ? (
          <p className={styles.muted}>No no-shows on record.</p>
        ) : (
          <div className={local.list}>
            {noShowBookings.map((b) => (
              <div key={b.id} className={local.row}>
                <div className={local.rowMain}>
                  <span className={local.rowTitle}>{b.service.name}</span>
                  <span className={local.rowSub}>
                    {b.provider.businessName} · {dateFmt.format(new Date(b.startTime))} · {b.paymentMethod}
                  </span>
                </div>
                {b.amountPaidMinor > 0 && <Badge tone="error">{money(b.amountPaidMinor)} forfeited</Badge>}
              </div>
            ))}
            {noShowOrders.map((o) => (
              <div key={o.id} className={local.row}>
                <div className={local.rowMain}>
                  <span className={local.rowTitle}>Order from {o.provider.businessName}</span>
                  <span className={local.rowSub}>
                    {dateFmt.format(new Date(o.createdAt))} · {o.paymentMethod}
                  </span>
                </div>
                {o.amountPaidMinor > 0 && <Badge tone="error">{money(o.amountPaidMinor)} forfeited</Badge>}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Charges">
        {penalties.length === 0 ? (
          <p className={styles.muted}>No charges yet.</p>
        ) : (
          <div className={local.list}>
            {penalties.map((p) => (
              <div key={p.id} className={local.row}>
                <div className={local.rowMain}>
                  <span className={local.rowTitle}>
                    {money(p.amountMinor)} — {p.reason}
                  </span>
                  <span className={local.rowSub}>
                    {dateFmt.format(new Date(p.createdAt))}
                    {p.note ? ` · ${p.note}` : ''}
                  </span>
                </div>
                <div className={local.rowRight}>
                  {p.status === 'PENDING' ? (
                    <>
                      <Button variant="secondary" onClick={() => setPenaltyStatus(p.id, 'WAIVED')}>
                        Waive
                      </Button>
                      <Button onClick={() => setPenaltyStatus(p.id, 'PAID')}>Mark paid</Button>
                    </>
                  ) : (
                    <Badge tone={p.status === 'PAID' ? 'success' : 'neutral'}>{p.status}</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {blockOpen && (
        <div className={local.overlay} role="dialog" aria-modal="true">
          <div className={local.modal}>
            <h3 className={local.modalTitle}>Block {user.fullName}?</h3>
            <p className={styles.muted}>They won't be able to log in until unblocked.</p>
            <label className={styles.label} htmlFor="blockReason">
              Reason <span className={styles.optional}>(optional)</span>
            </label>
            <textarea
              id="blockReason"
              className={styles.textarea}
              placeholder="e.g. Repeated no-shows on paid bookings."
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              maxLength={300}
            />
            <div className={styles.formActions}>
              <Button variant="secondary" onClick={closeBlock} disabled={blocking}>
                Cancel
              </Button>
              <Button loading={blocking} loadingText="Blocking…" onClick={confirmBlock}>
                Block account
              </Button>
            </div>
          </div>
        </div>
      )}

      {chargeOpen && (
        <div className={local.overlay} role="dialog" aria-modal="true">
          <div className={local.modal}>
            <form onSubmit={submitCharge} className={styles.form}>
              <p className={styles.formTitle}>Add a charge for {user.fullName}</p>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="chargeAmount">
                  Amount (₹)
                </label>
                <input
                  id="chargeAmount"
                  className={styles.input}
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="chargeReason">
                  Reason
                </label>
                <input
                  id="chargeReason"
                  className={styles.input}
                  placeholder="e.g. Repeated no-shows"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="chargeNote">
                  Note <span className={styles.optional}>(optional)</span>
                </label>
                <input
                  id="chargeNote"
                  className={styles.input}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
              {error && <AlertBanner tone="error">{error}</AlertBanner>}
              <div className={styles.formActions}>
                <Button type="button" variant="secondary" onClick={closeCharge} disabled={creatingPenalty}>
                  Cancel
                </Button>
                <Button type="submit" loading={creatingPenalty} loadingText="Adding…">
                  Add charge
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
