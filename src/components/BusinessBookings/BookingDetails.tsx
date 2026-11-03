import { CalendarDays, CalendarX2, Check, CircleAlert, IndianRupee, Phone, Play, Wallet, X } from 'lucide-react';

import { Pill } from '@/components/Pill';
import { BookingStatus, ProviderBooking } from '@/redux/api/provider/types';

import { ServiceIconBox } from './ServiceIconBox';
import {
  STATUS,
  dayLabel,
  durationMin,
  formatRequested,
  isCancelled,
  methodInfo,
  money,
  needsCollect,
  outstandingOf,
  shortId,
  startPassed,
  timeRange,
} from './bookingUtils';
import styles from './BusinessBookings.module.css';

const STEPS: { status: BookingStatus; label: string }[] = [
  { status: 'PENDING', label: 'New' },
  { status: 'CONFIRMED', label: 'Confirmed' },
  { status: 'IN_PROGRESS', label: 'In progress' },
  { status: 'COMPLETED', label: 'Completed' },
];

interface Props {
  booking: ProviderBooking;
  busy: boolean;
  error: string | null;
  onStatus: (b: ProviderBooking, to: BookingStatus) => void;
  onCollect: (b: ProviderBooking) => void;
  onCancel: (b: ProviderBooking) => void;
}

/** Right-hand "Booking Details" panel for the selected booking. */
export function BookingDetails({ booking: b, busy, error, onStatus, onCollect, onCancel }: Props) {
  const st = STATUS[b.status];
  const cancelled = isCancelled(b);
  const current = STEPS.findIndex((s) => s.status === b.status);
  const outstanding = outstandingOf(b);
  const collectable = needsCollect(b);
  const paid = b.amountPaidMinor ?? 0;
  const refunded = b.paymentStatus === 'REFUNDED';
  const method = methodInfo(b);
  const initial = b.user.fullName.trim().charAt(0).toUpperCase() || '?';
  const canNoShow = startPassed(b);
  const duration = durationMin(b);

  const noShowBtn = (
    <button
      type="button"
      className={`${styles.outlineBtn} ${styles.greyBtn}`}
      disabled={busy || !canNoShow}
      title={canNoShow ? undefined : 'Available after the start time'}
      onClick={() => onStatus(b, 'NO_SHOW')}
    >
      <CalendarX2 size={16} aria-hidden="true" />
      Mark No-show
    </button>
  );

  return (
    <section className={styles.details} aria-label={`Booking ${shortId(b)} details`}>
      <div className={styles.detailsHead}>
        <div className={styles.detailsIdRow}>
          <span className={styles.detailsId}>{shortId(b)}</span>
          <Pill tone={st.tone}>{st.label}</Pill>
        </div>
        {b.createdAt && <span className={styles.muted}>{formatRequested(b.createdAt)}</span>}
      </div>

      {cancelled ? (
        <div className={styles.cancelNote} role="note">
          <CircleAlert size={16} aria-hidden="true" />
          <div>
            <strong>{b.status === 'NO_SHOW' ? 'No-show' : 'Cancelled'}</strong>
            {b.cancelReason ? <span> — {b.cancelReason}</span> : null}
          </div>
        </div>
      ) : (
        <ol className={styles.stepper} aria-label="Booking progress">
          {STEPS.map((s, i) => {
            const state = i < current ? 'done' : i === current ? 'current' : 'todo';
            return (
              <li
                key={s.status}
                className={`${styles.step} ${styles[`step_${state}`]}`}
                aria-current={state === 'current' ? 'step' : undefined}
              >
                <span className={styles.stepDot} aria-hidden="true">
                  {state === 'done' && <Check size={10} strokeWidth={3} />}
                </span>
                <span className={styles.stepLabel}>{s.label}</span>
              </li>
            );
          })}
        </ol>
      )}

      <div className={styles.panelCard}>
        <div className={styles.apptWhen}>
          <CalendarDays size={20} aria-hidden="true" />
          <span>
            {dayLabel(b.startTime)}, {timeRange(b.startTime, b.endTime)}
          </span>
        </div>
        <div className={styles.apptService}>
          <ServiceIconBox name={b.service.name} />
          <div className={styles.customerText}>
            <span className={styles.strong}>{b.service.name}</span>
            {duration > 0 && <span className={styles.muted}>{duration} min</span>}
          </div>
          <span className={styles.apptPrice}>{money(b.amountMinor, b.currency)}</span>
        </div>
      </div>

      <div className={`${styles.panelCard} ${styles.customerCard}`}>
        <span className={styles.avatar} aria-hidden="true">
          {initial}
        </span>
        <div className={styles.customerText}>
          <span className={styles.strong}>{b.user.fullName}</span>
          {b.user.phone && <span className={styles.muted}>{b.user.phone}</span>}
        </div>
        {b.user.phone && (
          <a
            className={styles.callBtn}
            href={`tel:${b.user.phone}`}
            aria-label={`Call ${b.user.fullName}`}
            title="Call customer"
          >
            <Phone size={18} aria-hidden="true" />
          </a>
        )}
      </div>

      <div className={styles.panelCard}>
        <div className={styles.payHead}>
          <Wallet size={20} aria-hidden="true" />
          <span className={styles.strong}>{method.text}</span>
          <span className={styles.methodChip}>{method.chip}</span>
        </div>
        <dl className={styles.totals}>
          <div>
            <dt>Price</dt>
            <dd>{money(b.amountMinor, b.currency)}</dd>
          </div>
          <div>
            <dt>Paid</dt>
            <dd>{money(paid, b.currency)}</dd>
          </div>
          {refunded && (
            <div>
              <dt>Refunded</dt>
              <dd>{money(paid, b.currency)}</dd>
            </div>
          )}
          {collectable && (
            <div className={styles.dueRow}>
              <dt>Due</dt>
              <dd>{money(outstanding, b.currency)}</dd>
            </div>
          )}
        </dl>
      </div>

      {error && (
        <div className={styles.cancelNote} role="alert">
          <CircleAlert size={16} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {(b.status === 'PENDING' || b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS' || collectable) && (
        <div className={styles.actions}>
          {b.status === 'PENDING' && (
            <>
              <button type="button" className={styles.primaryBtn} disabled={busy} onClick={() => onStatus(b, 'CONFIRMED')}>
                <Check size={18} aria-hidden="true" />
                Accept Booking
              </button>
              <div className={styles.actionRow}>
                <button
                  type="button"
                  className={`${styles.outlineBtn} ${styles.cancelBtn}`}
                  disabled={busy}
                  onClick={() => onCancel(b)}
                >
                  <X size={16} aria-hidden="true" />
                  Decline
                </button>
                {noShowBtn}
              </div>
            </>
          )}
          {b.status === 'CONFIRMED' && (
            <>
              <button type="button" className={styles.primaryBtn} disabled={busy} onClick={() => onStatus(b, 'IN_PROGRESS')}>
                <Play size={16} aria-hidden="true" />
                Start Service
              </button>
              <div className={styles.actionRow}>
                <button
                  type="button"
                  className={`${styles.outlineBtn} ${styles.cancelBtn}`}
                  disabled={busy}
                  onClick={() => onCancel(b)}
                >
                  <X size={16} aria-hidden="true" />
                  Cancel
                </button>
                {noShowBtn}
              </div>
            </>
          )}
          {b.status === 'IN_PROGRESS' && (
            <button type="button" className={styles.primaryBtn} disabled={busy} onClick={() => onStatus(b, 'COMPLETED')}>
              <Check size={18} aria-hidden="true" />
              Complete Service
            </button>
          )}
          {collectable && (
            <button
              type="button"
              className={`${styles.outlineBtn} ${styles.collectBtn}`}
              disabled={busy}
              onClick={() => onCollect(b)}
            >
              <IndianRupee size={16} aria-hidden="true" />
              Collect {money(outstanding, b.currency)}
            </button>
          )}
          {b.status === 'PENDING' && (
            <p className={styles.caption}>After accepting: Start service → Complete → Collect payment</p>
          )}
        </div>
      )}
    </section>
  );
}
