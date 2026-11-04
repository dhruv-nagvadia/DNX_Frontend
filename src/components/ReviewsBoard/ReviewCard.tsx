import { FormEvent, useState } from 'react';
import { Info, Package, PencilLine, Reply } from 'lucide-react';

import {
  useReplyToProductReviewMutation,
  useReplyToReviewMutation,
} from '@/redux/api/provider/providerApi';

import { BoardReview, initialOf, relativeTime, toneFor } from './reviewsUtil';
import { Stars } from './Stars';
import styles from './ReviewsBoard.module.css';

const MAX_REPLY = 1000;

function errorText(err: unknown): string {
  const e = err as { data?: { message?: string | string[] }; status?: number | string };
  const msg = e?.data?.message;
  if (Array.isArray(msg)) return msg.join(', ');
  if (typeof msg === 'string' && msg) return msg;
  if (e?.status === 'FETCH_ERROR') return 'Network error — check your connection and try again.';
  return 'Could not save the reply. Please try again.';
}

/** One review card: customer, business/product, stars, comment, reply area. */
export function ReviewCard({ review }: { review: BoardReview }) {
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [replyBusiness, businessState] = useReplyToReviewMutation();
  const [replyProduct, productState] = useReplyToProductReviewMutation();
  const busy = businessState.isLoading || productState.isLoading;

  const hasReply = !!review.reply;
  const customerTone = toneFor(review.customer);
  const businessTone = toneFor(review.businessId || review.businessName);

  const send = async (reply: string | null) => {
    setError(null);
    try {
      if (review.kind === 'product' && review.product) {
        await replyProduct({
          providerId: review.businessId,
          productId: review.product.id,
          reviewId: review.id,
          reply,
        }).unwrap();
      } else {
        await replyBusiness({ providerId: review.businessId, reviewId: review.id, reply }).unwrap();
      }
      setComposing(false);
    } catch (err) {
      setError(errorText(err));
    }
  };

  const openComposer = () => {
    setDraft(review.reply ?? '');
    setError(null);
    setComposing(true);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) {
      setError('Write a reply first.');
      return;
    }
    void send(text);
  };

  const onRemove = () => {
    if (!window.confirm('Remove your public reply to this review?')) return;
    void send(null);
  };

  const composer = (
    <form className={styles.composer} onSubmit={onSubmit}>
      <textarea
        className={styles.composerInput}
        placeholder="Write a public reply..."
        value={draft}
        maxLength={MAX_REPLY}
        rows={2}
        autoFocus
        disabled={busy}
        aria-label={`Reply to ${review.customer}`}
        onChange={(e) => setDraft(e.target.value)}
      />
      <div className={styles.composerFoot}>
        <span className={styles.composerHint}>
          <Info size={13} aria-hidden="true" />
          Replies are public
          <span className={styles.composerCount}>
            {draft.length}/{MAX_REPLY}
          </span>
        </span>
        <div className={styles.composerActions}>
          {hasReply && (
            <button type="button" className={styles.removeBtn} onClick={onRemove} disabled={busy}>
              Remove reply
            </button>
          )}
          <button
            type="button"
            className={styles.cancelBtn}
            disabled={busy}
            onClick={() => {
              setComposing(false);
              setError(null);
            }}
          >
            Cancel
          </button>
          <button type="submit" className={styles.postBtn} disabled={busy || !draft.trim()}>
            {busy ? 'Saving…' : 'Post reply'}
          </button>
        </div>
      </div>
      {error && (
        <p className={styles.composerError} role="alert">
          {error}
        </p>
      )}
    </form>
  );

  return (
    <article className={styles.card}>
      <span
        className={styles.avatar}
        style={{
          background: `var(--m-pill-${customerTone}-bg)`,
          color: `var(--m-pill-${customerTone}-fg)`,
        }}
        aria-hidden="true"
      >
        {initialOf(review.customer)}
      </span>

      <div className={styles.cardBody}>
        <header className={styles.cardHead}>
          <div className={styles.who}>
            <span className={styles.customer}>{review.customer}</span>
            <time className={styles.when} dateTime={review.createdAt}>
              {relativeTime(review.createdAt)}
            </time>
          </div>
          {review.businessName && (
            <span
              className={styles.bizPill}
              style={{ background: `var(--m-pill-${businessTone}-bg)` }}
            >
              <span
                className={styles.bizDot}
                style={{ background: `var(--m-pill-${businessTone}-fg)` }}
                aria-hidden="true"
              />
              {review.businessName}
            </span>
          )}
          {review.product && (
            <span className={styles.productChip} title={review.product.name}>
              {review.product.imageUrl ? (
                <img className={styles.productThumb} src={review.product.imageUrl} alt="" />
              ) : (
                <span className={styles.productThumbEmpty} aria-hidden="true">
                  <Package size={14} />
                </span>
              )}
              <span className={styles.productName}>{review.product.name}</span>
            </span>
          )}
        </header>

        <Stars rating={review.rating} size={18} label={`${review.rating} out of 5 stars`} />
        {review.comment ? (
          <p className={styles.comment}>{review.comment}</p>
        ) : (
          <p className={styles.commentEmpty}>No written comment.</p>
        )}

        {hasReply && !composing && (
          <div className={styles.replyBox}>
            <Reply size={16} className={styles.replyIcon} aria-hidden="true" />
            <div className={styles.replyMain}>
              <div className={styles.replyHead}>
                <span className={styles.replyLabel}>Your reply</span>
                {review.repliedAt && (
                  <span className={styles.replyWhen}>· {relativeTime(review.repliedAt)}</span>
                )}
              </div>
              <p className={styles.replyText}>{review.reply}</p>
            </div>
            <button type="button" className={styles.editLink} onClick={openComposer}>
              <PencilLine size={14} aria-hidden="true" />
              Edit reply
            </button>
          </div>
        )}

        {!hasReply && !composing && (
          <div className={styles.needsRow}>
            <span className={styles.needsPill}>
              <Reply size={14} aria-hidden="true" />
              Needs reply
            </span>
            <button type="button" className={styles.replyBtn} onClick={openComposer}>
              <Reply size={15} aria-hidden="true" />
              Reply
            </button>
          </div>
        )}

        {composing && (
          <div className={styles.composeRow}>
            {!hasReply && (
              <span className={styles.needsPill}>
                <Reply size={14} aria-hidden="true" />
                Needs reply
              </span>
            )}
            {composer}
          </div>
        )}
      </div>
    </article>
  );
}
