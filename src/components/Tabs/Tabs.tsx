import { TabsProps } from './types';
import styles from './Tabs.module.css';

/** Horizontal segmented tab bar for switching between sections of a page. */
export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div className={`${styles.tabs} ${className ?? ''}`} role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
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
