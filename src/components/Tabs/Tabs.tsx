import { useLayoutEffect, useRef, useState } from 'react';
import { TabsProps } from './types';
import styles from './Tabs.module.css';

interface IndicatorRect {
  left: number;
  width: number;
}

/**
 * Horizontal segmented tab bar for switching between sections of a page.
 * The active pill is a single element that slides and resizes to the active
 * tab (measured via its real layout) instead of each tab swapping its own
 * background — so switching tabs reads as one continuous motion.
 */
export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [indicator, setIndicator] = useState<IndicatorRect | null>(null);

  const measure = () => {
    const track = trackRef.current;
    const activeTab = tabRefs.current.get(active);
    if (!track || !activeTab) return;
    const trackRect = track.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();
    setIndicator({ left: tabRect.left - trackRect.left, width: tabRect.width });
  };

  // Re-measure synchronously before paint whenever the active tab (or the
  // set of tabs itself — labels/counts can change the layout) changes, so
  // the indicator never flashes at a stale position.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(measure, [active, tabs]);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={trackRef} className={`${styles.tabs} ${className ?? ''}`} role="tablist">
      {indicator && (
        <span
          className={styles.indicator}
          style={{ transform: `translateX(${indicator.left}px)`, width: indicator.width }}
          aria-hidden="true"
        />
      )}
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              if (el) tabRefs.current.set(tab.id, el);
              else tabRefs.current.delete(tab.id);
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.icon && <span className={styles.icon}>{tab.icon}</span>}
            {tab.label}
            {typeof tab.count === 'number' && <span className={styles.count}>{tab.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
