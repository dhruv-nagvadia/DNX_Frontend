import { Mail, MessageCircle, Phone } from 'lucide-react';

import { AppShell } from '@/components/AppShell';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { SUPPORT, supportLinks } from '@/utils/support';

import styles from './SupportPage.module.css';

/**
 * Direct, always-visible ways to reach DNX support — no ticket/chat-only
 * dead end when something goes wrong mid-job.
 */
export default function SupportPage() {
  return (
    <AppShell>
      <PageHeader
        title="Support"
        subtitle="Something wrong on a job, a payment issue, or anything else — reach us directly."
      />

      <Card>
        <div className={styles.options}>
          <a className={styles.option} href={supportLinks.call}>
            <span className={`${styles.icon} ${styles.iconCall}`}>
              <Phone size={20} aria-hidden="true" />
            </span>
            <span className={styles.optionText}>
              <span className={styles.optionLabel}>Call us</span>
              <span className={styles.optionValue}>{SUPPORT.phoneDisplay}</span>
            </span>
          </a>

          <a
            className={styles.option}
            href={supportLinks.whatsapp}
            target="_blank"
            rel="noreferrer"
          >
            <span className={`${styles.icon} ${styles.iconWhatsapp}`}>
              <MessageCircle size={20} aria-hidden="true" />
            </span>
            <span className={styles.optionText}>
              <span className={styles.optionLabel}>WhatsApp us</span>
              <span className={styles.optionValue}>{SUPPORT.phoneDisplay}</span>
            </span>
          </a>

          <a className={styles.option} href={supportLinks.email}>
            <span className={`${styles.icon} ${styles.iconEmail}`}>
              <Mail size={20} aria-hidden="true" />
            </span>
            <span className={styles.optionText}>
              <span className={styles.optionLabel}>Email us</span>
              <span className={styles.optionValue}>{SUPPORT.email}</span>
            </span>
          </a>
        </div>
      </Card>
    </AppShell>
  );
}
