import { SkeletonProps } from './types';
import styles from './Skeleton.module.css';

/**
 * Shimmer placeholder. Prefer this over a "Loading…" line: it keeps the
 * layout stable, so content doesn't jump when the request resolves.
 */
export function Skeleton({ width, height = 16, radius, className }: SkeletonProps) {
  return (
    <span
      className={`${styles.skeleton} ${className ?? ''}`}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  );
}
