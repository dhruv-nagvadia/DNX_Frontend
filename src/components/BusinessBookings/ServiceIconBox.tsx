import { serviceIcon } from '@/utils/serviceIcon';

import styles from './BusinessBookings.module.css';

/** Soft-lavender rounded square holding the service's keyword icon. */
export function ServiceIconBox({ name }: { name: string }) {
  const Icon = serviceIcon(name);
  return (
    <span className={styles.svcIcon} aria-hidden="true">
      <Icon size={20} />
    </span>
  );
}
