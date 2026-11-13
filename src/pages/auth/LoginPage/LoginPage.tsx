import { Lock, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

import { AlertBanner } from '@/components/AlertBanner';
import { Checkbox } from '@/components/Checkbox';

import { AuthField, AuthSplitLayout, AuthSubmit, authCard as card } from '../AuthSplitLayout';
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
    <AuthSplitLayout
      headline={
        <>
          Run your business,
          <br />
          all in one place
        </>
      }
      subhead="Manage bookings, orders, offers and earnings for every business you own."
    >
      <form className={card.card} onSubmit={onSubmit} noValidate>
        <header className={card.head}>
          <h2 className={card.title}>Welcome back</h2>
          <p className={card.subtitle}>Sign in to your provider account</p>
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
            placeholder="you@business.com"
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

        <div className={card.metaRow}>
          <Checkbox
            name="remember"
            label="Keep me signed in"
            checked={remember}
            onChange={onRememberChange}
            disabled={isLoading}
          />
          <Link className={card.link} to="/forgot-password">
            Forgot password?
          </Link>
        </div>

        <AuthSubmit loading={isLoading} loadingText="Signing in…">
          Sign in
        </AuthSubmit>

        <p className={card.switch}>
          New provider?{' '}
          <Link className={card.link} to="/register">
            Create an account
          </Link>
        </p>
      </form>
    </AuthSplitLayout>
  );
}
