import { Lightbulb, MapPin, Star, Store } from 'lucide-react';

import styles from './BusinessFormPage.module.css';

interface LivePreviewProps {
  coverUrl: string | null;
  name: string;
  categoryLabel: string | null;
  city: string;
  /** e.g. "4.6 (23)" for an existing business; null → "New". */
  rating: string | null;
  tip: string;
}

/** Right-hand column: how customers will see the business, plus a tip for the current step. */
export function LivePreview({ coverUrl, name, categoryLabel, city, rating, tip }: LivePreviewProps) {
  return (
    <aside className={styles.side} aria-label="Live preview">
      <div className={styles.previewCard}>
        <h2 className={styles.previewHeading}>Live preview</h2>
        <div className={styles.previewCover}>
          {coverUrl ? (
            <img className={styles.previewImg} src={coverUrl} alt="" />
          ) : (
            <span className={styles.previewPlaceholder} aria-hidden="true">
              <Store size={56} strokeWidth={1.4} />
            </span>
          )}
        </div>
        <p className={`${styles.previewName} ${name ? '' : styles.previewMuted}`}>{name || 'Your Business'}</p>
        <span className={`${styles.previewPill} ${categoryLabel ? '' : styles.previewPillEmpty}`}>
          {categoryLabel || 'Category'}
        </span>
        <p className={styles.previewMeta}>
          <MapPin size={17} aria-hidden="true" />
          <span className={city ? '' : styles.previewMuted}>{city || 'City'}</span>
        </p>
        <p className={styles.previewMeta}>
          <Star size={17} className={styles.previewStar} aria-hidden="true" />
          <span>{rating ?? 'New'}</span>
        </p>
      </div>

      <div className={styles.tip}>
        <p className={styles.tipTitle}>
          <Lightbulb size={20} aria-hidden="true" />
          Tip
        </p>
        <p className={styles.tipText}>{tip}</p>
      </div>
    </aside>
  );
}
