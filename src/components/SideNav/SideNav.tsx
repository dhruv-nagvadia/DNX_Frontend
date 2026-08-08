import { SideNavProps } from './types';
import styles from './SideNav.module.css';

/** Vertical section switcher used inside the shell's rail. */
export function SideNav({ items, active, onChange, header }: SideNavProps) {
  return (
    <div className={styles.wrap}>
      {header && <div className={styles.header}>{header}</div>}
      <nav className={styles.list} aria-label="Sections">
        {items.map((item) => {
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              type="button"
              className={`${styles.item} ${isActive ? styles.itemActive : ''}`}
              onClick={() => onChange(item.id)}
              aria-current={isActive ? 'page' : undefined}
            >
              {item.icon && <span className={styles.icon}>{item.icon}</span>}
              <span className={styles.label}>{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span className={styles.count}>{item.count}</span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
