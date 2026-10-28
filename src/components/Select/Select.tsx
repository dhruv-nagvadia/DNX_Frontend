import { forwardRef, SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

import styles from './Select.module.css';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

/**
 * A plain `<select>`, styled consistently everywhere — `appearance: none`
 * hides the browser's own arrow (which varies by OS/browser and, with this
 * app's padding, could sit flush against or spill past the field's edge),
 * replaced by one fixed chevron that always sits inside the box.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, children, ...rest },
  ref,
) {
  return (
    <div className={`${styles.wrap} ${className ?? ''}`}>
      <select ref={ref} className={styles.select} {...rest}>
        {children}
      </select>
      <ChevronDown size={16} className={styles.chevron} aria-hidden="true" />
    </div>
  );
});
