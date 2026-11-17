import { Lock, Mail, ShieldCheck } from 'lucide-react';

import { AlertBanner } from '@/components/AlertBanner';
import { AdminAuthLayout } from '@/components/AdminAuthLayout';
import { AuthField, AuthSubmit, authCard as card } from '@/pages/auth/AuthSplitLayout';

import { useAdminLoginPage } from './useAdminLoginPage';
import styles from './AdminLoginPage.module.css';

/** JSX only — logic comes from useAdminLoginPage. Login-only: no signup, no "forgot password" link. */
export default function AdminLoginPage() {
  const { form, errors, serverError, isLoading, onChange, onBlur, onSubmit } = useAdminLoginPage();

  return (
    <AdminAuthLayout>
      <form className={card.card} onSubmit={onSubmit} noValidate>
        <header className={card.head}>
          <span className={styles.eyebrow}>
            <ShieldCheck size={14} aria-hidden="true" />
            Admin sign in
          </span>
          <h2 className={card.title}>DNX Admin Console</h2>
          <p className={card.subtitle}>Sign in to manage the marketplace</p>
        </header>

        {serverError && <AlertBanner tone="error">{serverError}</AlertBanner>}

        <div className={card.fields}>
          <AuthField
            id="email"
            name="email"
            label="Email"
            icon={Mail}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus
            placeholder="admin@dnx.com"
            value={form.email}
            onChange={onChange}
            onBlur={onBlur}
            disabled={isLoading}
            error={errors.email}
          />

          <AuthField
            id="password"
            name="password"
            label="Password"
            icon={Lock}
            passwordToggle
            autoComplete="current-password"
            placeholder="Enter your password"
            value={form.password}
            onChange={onChange}
            onBlur={onBlur}
            disabled={isLoading}
            error={errors.password}
          />
        </div>

        <AuthSubmit loading={isLoading} loadingText="Signing in…">
          Sign in
        </AuthSubmit>

        <p className={card.switch}>Access is limited to DNX administrators.</p>
      </form>
    </AdminAuthLayout>
  );
}
