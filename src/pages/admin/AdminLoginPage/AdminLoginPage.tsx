import { ArrowRight, Lock } from 'lucide-react';

import { AlertBanner } from '@/components/AlertBanner';
import { AdminAuthLayout } from '@/components/AdminAuthLayout';
import { Button } from '@/components/Button';
import { PasswordField } from '@/components/PasswordField';
import { TextField } from '@/components/TextField';

import shared from '@/pages/auth/AuthForm.module.css';
import { useAdminLoginPage } from './useAdminLoginPage';

/** JSX only — logic comes from useAdminLoginPage. Login-only: no signup, no "forgot password" link. */
export default function AdminLoginPage() {
  const { form, errors, serverError, isLoading, onChange, onBlur, onSubmit } = useAdminLoginPage();

  return (
    <AdminAuthLayout>
      <form className={shared.form} onSubmit={onSubmit} noValidate>
        <header className={shared.head}>
          <span className={shared.eyebrow}>
            <Lock size={13} aria-hidden="true" />
            Admin sign in
          </span>
          <h2 className={shared.title}>Restricted access</h2>
          <p className={shared.subtitle}>Sign in with your admin credentials to continue.</p>
        </header>

        {serverError && <AlertBanner tone="error">{serverError}</AlertBanner>}

        <div className={shared.fields}>
          <TextField
            dense
            label="Email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus
            placeholder="admin@dnx.com"
            value={form.email}
            onChange={onChange}
            onBlur={onBlur}
            error={errors.email}
            disabled={isLoading}
          />

          <PasswordField
            dense
            label="Password"
            name="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={form.password}
            onChange={onChange}
            onBlur={onBlur}
            error={errors.password}
            disabled={isLoading}
          />
        </div>

        <Button
          type="submit"
          fullWidth
          loading={isLoading}
          loadingText="Signing in…"
          iconRight={<ArrowRight size={18} aria-hidden="true" />}
        >
          Sign in
        </Button>
      </form>
    </AdminAuthLayout>
  );
}
