import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

import { AlertBanner } from '@/components/AlertBanner';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { PasswordField } from '@/components/PasswordField';
import { TextField } from '@/components/TextField';

import shared from '../AuthForm.module.css';
import { useLoginPage } from './useLoginPage';

/** JSX only — logic comes from useLoginPage. */
export default function LoginPage() {
  const {
    form,
    errors,
    serverError,
    isLoading,
    remember,
    onChange,
    onBlur,
    onRememberChange,
    onSubmit,
  } = useLoginPage();

  return (
    <AuthLayout>
      <form className={shared.form} onSubmit={onSubmit} noValidate>
        <header className={shared.head}>
          <span className={shared.eyebrow}>
            <ShieldCheck size={13} aria-hidden="true" />
            Provider sign in
          </span>
          <h2 className={shared.title}>Welcome back</h2>
          <p className={shared.subtitle}>
            Pick up where you left off — today&apos;s bookings are waiting.
          </p>
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
            placeholder="you@business.com"
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

        <div className={shared.metaRow}>
          <Checkbox
            name="remember"
            label="Keep me signed in"
            checked={remember}
            onChange={onRememberChange}
            disabled={isLoading}
          />
          {/* Password reset link goes here once the backend exposes the flow. */}
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

        <p className={`${shared.switch} ${shared.footer}`}>
          New to DNX?{' '}
          <Link className={shared.switchLink} to="/register">
            Create a free account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
