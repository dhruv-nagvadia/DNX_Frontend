import { useState } from 'react';
import { Package } from 'lucide-react';

import styles from './OrdersManager.module.css';

/** Rounded product photo, falling back to a box icon when missing or broken. */
export function ItemThumb({ src, size, className }: { src?: string | null; size: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size };
  if (!src || failed) {
    return (
      <span className={`${styles.thumb} ${styles.thumbFallback} ${className ?? ''}`} style={style} aria-hidden="true">
        <Package size={Math.round(size * 0.45)} />
      </span>
    );
  }
  return (
    <img
      className={`${styles.thumb} ${className ?? ''}`}
      style={style}
      src={src}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
