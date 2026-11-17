import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Ban,
  CalendarDays,
  CalendarX2,
  CreditCard,
  IndianRupee,
  Mail,
  PackageX,
  Phone,
  Receipt,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';

import { AlertBanner } from '@/components/AlertBanner';
import { Button } from '@/components/Button';
import { FormDialog } from '@/components/FormDialog';
import { ModernCard } from '@/components/ModernCard';
import { Pill } from '@/components/Pill';
import { Skeleton } from '@/components/Skeleton';
import { AdminUserDetailProps } from './types';
import { useAdminUserDetail } from './useAdminUserDetail';
// Generic field/label/form styling shared across provider/admin forms.
import styles from '@/components/ServicesManager/ServicesManager.module.css';
import ui from './AdminUserProfile.module.css';

const dateFmt = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const money = (minor: number) => `₹${(minor / 100).toLocaleString('en-IN')}`;

const PAYMENT_LABEL: Record<'ONLINE' | 'CASH' | 'PARTIAL', string> = {
  ONLINE: 'Paid online',
  CASH: 'Cash',
  PARTIAL: 'Part-paid',
};

function StatTile({
  tone,
  icon,
  label,
  value,
}: {
  tone: 'blue' | 'peach' | 'lavender' | 'pink';
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className={`${ui.tile} ${ui[`tile_${tone}`]}`}>
      <span className={ui.tileIcon} aria-hidden="true">
        {icon}
      </span>
      <div className={ui.tileText}>
        <span className={ui.tileLabel}>{label}</span>
        <span className={ui.tileValue}>{value}</span>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link to="/admin/users" className={ui.back}>
      <ArrowLeft size={16} aria-hidden="true" />
      All customers
    </Link>
  );
}

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
      <div className={ui.root}>
        <BackLink />
        <Skeleton height={150} radius="var(--m-radius-card)" />
        <Skeleton height={84} radius="var(--m-radius-card)" />
        <Skeleton height={220} radius="var(--m-radius-card)" />
      </div>
    );
  }

  const { user, noShowBookings, noShowOrders, penalties } = data;
  const totalNoShows = noShowBookings.length + noShowOrders.length;
  const forfeited =
    noShowBookings.reduce((s, b) => s + b.amountPaidMinor, 0) +
    noShowOrders.reduce((s, o) => s + o.amountPaidMinor, 0);
  const pendingCharges = penalties
    .filter((p) => p.status === 'PENDING')
    .reduce((s, p) => s + p.amountMinor, 0);

  return (
    <div className={ui.root}>
      <BackLink />

      <section className={ui.hero} aria-labelledby="customerName">
        <div className={ui.heroBody}>
          <span className={ui.avatar} aria-hidden="true">
            {user.fullName.trim().charAt(0).toUpperCase() || '?'}
          </span>
          <div className={ui.identity}>
            <h1 id="customerName" className={ui.name}>
              {user.fullName}
            </h1>
            <ul className={ui.contact}>
              <li>
                <Mail size={15} aria-hidden="true" />
                <span className={ui.contactText}>{user.email}</span>
              </li>
              <li>
                <Phone size={15} aria-hidden="true" />
                <span className={ui.contactText}>{user.phone ?? 'No phone'}</span>
              </li>
              <li>
                <CalendarDays size={15} aria-hidden="true" />
                <span className={ui.contactText}>Joined {dateFmt.format(new Date(user.createdAt))}</span>
              </li>
            </ul>
            <div className={ui.pills}>
              {user.isBlocked ? <Pill tone="red">Account blocked</Pill> : <Pill tone="green">Active</Pill>}
              {user.codDisabled ? (
                <Pill tone="yellow">Cash on Delivery disabled</Pill>
              ) : (
                <Pill tone="blue">COD allowed</Pill>
              )}
              <Pill tone={totalNoShows >= 3 ? 'red' : totalNoShows > 0 ? 'orange' : 'grey'}>
                {totalNoShows} no-show{totalNoShows === 1 ? '' : 's'} on record
              </Pill>
            </div>
          </div>
          <div className={ui.actions}>
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
              <Button variant="secondary" loading={togglingCod} onClick={() => toggleCod(true)}>
                Disable COD
              </Button>
            )}
            <Button iconLeft={<CreditCard size={16} aria-hidden="true" />} onClick={openCharge}>
              Add charge
            </Button>
          </div>
        </div>

        {user.isBlocked && user.blockedReason && (
          <div className={ui.blockedNote}>
            <AlertBanner tone="error">Blocked: {user.blockedReason}</AlertBanner>
          </div>
        )}
      </section>

      <div className={ui.tiles}>
        <StatTile tone="peach" icon={<ShieldAlert size={20} />} label="No-shows" value={totalNoShows} />
        <StatTile tone="pink" icon={<IndianRupee size={20} />} label="Forfeited" value={money(forfeited)} />
        <StatTile tone="lavender" icon={<Receipt size={20} />} label="Charges" value={penalties.length} />
        <StatTile tone="blue" icon={<CreditCard size={20} />} label="Pending charges" value={money(pendingCharges)} />
      </div>

      <div className={ui.columns}>
        <ModernCard
          icon={<ShieldAlert size={20} aria-hidden="true" />}
          iconTone="warning"
          title="No-show history"
          suffix={totalNoShows > 0 ? `(${totalNoShows})` : undefined}
        >
          {totalNoShows === 0 ? (
            <p className={ui.empty}>No no-shows on record.</p>
          ) : (
            <ul className={ui.list}>
              {noShowBookings.map((b) => (
                <li key={b.id} className={ui.row}>
                  <span className={`${ui.rowIcon} ${ui.rowIcon_lavender}`} aria-hidden="true">
                    <CalendarX2 size={18} />
                  </span>
                  <div className={ui.rowMain}>
                    <span className={ui.rowTitle}>{b.service.name}</span>
                    <span className={ui.rowSub}>
                      {b.provider.businessName} · {dateFmt.format(new Date(b.startTime))}
                    </span>
                  </div>
                  <div className={ui.rowRight}>
                    <Pill tone="grey">{PAYMENT_LABEL[b.paymentMethod] ?? b.paymentMethod}</Pill>
                    {b.amountPaidMinor > 0 && (
                      <Pill tone="red">{money(b.amountPaidMinor)} forfeited</Pill>
                    )}
                  </div>
                </li>
              ))}
              {noShowOrders.map((o) => (
                <li key={o.id} className={ui.row}>
                  <span className={`${ui.rowIcon} ${ui.rowIcon_blue}`} aria-hidden="true">
                    <PackageX size={18} />
                  </span>
                  <div className={ui.rowMain}>
                    <span className={ui.rowTitle}>Order from {o.provider.businessName}</span>
                    <span className={ui.rowSub}>{dateFmt.format(new Date(o.createdAt))}</span>
                  </div>
                  <div className={ui.rowRight}>
                    <Pill tone="grey">{PAYMENT_LABEL[o.paymentMethod] ?? o.paymentMethod}</Pill>
                    {o.amountPaidMinor > 0 && (
                      <Pill tone="red">{money(o.amountPaidMinor)} forfeited</Pill>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ModernCard>

        <ModernCard
          icon={<Receipt size={20} aria-hidden="true" />}
          title="Charges"
          suffix={penalties.length > 0 ? `(${penalties.length})` : undefined}
        >
          {penalties.length === 0 ? (
            <p className={ui.empty}>No charges yet.</p>
          ) : (
            <ul className={ui.list}>
              {penalties.map((p) => (
                <li key={p.id} className={ui.row}>
                  <span className={`${ui.rowIcon} ${ui.rowIcon_peach}`} aria-hidden="true">
                    <IndianRupee size={18} />
                  </span>
                  <div className={ui.rowMain}>
                    <span className={ui.rowTitle}>
                      <span className={ui.amount}>{money(p.amountMinor)}</span> — {p.reason}
                    </span>
                    <span className={ui.rowSub}>
                      {dateFmt.format(new Date(p.createdAt))}
                      {p.note ? ` · ${p.note}` : ''}
                    </span>
                  </div>
                  <div className={ui.rowRight}>
                    {p.status === 'PENDING' ? (
                      <>
                        <Button variant="secondary" onClick={() => setPenaltyStatus(p.id, 'WAIVED')}>
                          Waive
                        </Button>
                        <Button onClick={() => setPenaltyStatus(p.id, 'PAID')}>Mark paid</Button>
                      </>
                    ) : (
                      <Pill tone={p.status === 'PAID' ? 'green' : 'grey'}>
                        {p.status === 'PAID' ? 'Paid' : 'Waived'}
                      </Pill>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ModernCard>
      </div>

      <FormDialog
        open={blockOpen}
        size="sm"
        tone="danger"
        title={`Block ${user.fullName}?`}
        subtitle="They won't be able to log in until unblocked."
        onClose={closeBlock}
        onSubmit={(e) => {
          e.preventDefault();
          void confirmBlock();
        }}
        submitLabel="Block account"
        submitting={blocking}
        submittingLabel="Blocking…"
        initialFocus="firstField"
      >
        <div className={styles.field}>
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
        </div>
      </FormDialog>

      <FormDialog
        open={chargeOpen}
        size="sm"
        title={`Add a charge for ${user.fullName}`}
        onClose={closeCharge}
        onSubmit={submitCharge}
        error={error}
        submitLabel="Add charge"
        submitting={creatingPenalty}
        submittingLabel="Adding…"
        initialFocus="firstField"
      >
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
      </FormDialog>
    </div>
  );
}
