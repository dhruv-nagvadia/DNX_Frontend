import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

import { AlertBanner } from '@/components/AlertBanner';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { PasswordField } from '@/components/PasswordField';
import { TextField } from '@/components/TextField';

import shared from '../AuthForm.module.css';
import { useRegisterPage } from './useRegisterPage';

/** JSX only — logic comes from useRegisterPage. */
export default function RegisterPage() {
  const { form, errors, serverError, accountExists, isLoading, onChange, onBlur, onSubmit } =
    useRegisterPage();

  return (
    <AuthLayout>
      <form className={shared.form} onSubmit={onSubmit} noValidate>
        <header className={shared.head}>
          <span className={shared.eyebrow}>
            <Sparkles size={13} aria-hidden="true" />
            Free to start
          </span>
          <h2 className={shared.title}>Create your account</h2>
          <p className={shared.subtitle}>
            List your business, take bookings and get paid — set up in a few minutes.
          </p>
        </header>

        {serverError && (
          <AlertBanner tone="error">
            {serverError}
            {/* An existing email is not a dead end — offer the way forward. */}
            {accountExists && (
              <>
                {' '}
                <Link className={shared.bannerLink} to="/login">
                  Sign in instead
                </Link>
              </>
            )}
          </AlertBanner>
        )}

        <div className={shared.fields}>
          <TextField
            dense
            label="Full name"
            name="fullName"
            autoComplete="name"
            autoFocus
            placeholder="Your name"
            value={form.fullName}
            onChange={onChange}
            onBlur={onBlur}
            error={errors.fullName}
            disabled={isLoading}
          />

          <div className={shared.row}>
            <TextField
              dense
              label="Email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@work.com"
              value={form.email}
              onChange={onChange}
              onBlur={onBlur}
              error={errors.email}
              disabled={isLoading}
            />
            <TextField
              dense
              label="Phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={10}
              prefix="+91"
              placeholder="9876543210"
              value={form.phone}
              onChange={onChange}
              onBlur={onBlur}
              error={errors.phone}
              disabled={isLoading}
            />
          </div>

          <div className={shared.row}>
            <PasswordField
              dense
              showStrength
              label="Password"
              name="password"
              autoComplete="new-password"
              placeholder="8+ characters"
              value={form.password}
              onChange={onChange}
              onBlur={onBlur}
              error={errors.password}
              disabled={isLoading}
            />
            <PasswordField
              dense
              label="Confirm password"
              name="confirmPassword"
              autoComplete="new-password"
              placeholder="Repeat it"
              value={form.confirmPassword}
              onChange={onChange}
              onBlur={onBlur}
              error={errors.confirmPassword}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Legal links open in a new tab so reading them never discards the form. */}
        <Checkbox
          name="acceptTerms"
          checked={form.acceptTerms}
          onChange={onChange}
          error={errors.acceptTerms}
          disabled={isLoading}
          label={
            <>
              I agree to the{' '}
              <a href="/terms" target="_blank" rel="noreferrer">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" target="_blank" rel="noreferrer">
                Privacy Policy
              </a>
            </>
          }
        />

        <Button
          type="submit"
          fullWidth
          loading={isLoading}
          loadingText="Creating your account…"
          iconRight={<ArrowRight size={18} aria-hidden="true" />}
        >
          Create account
        </Button>

        <p className={`${shared.switch} ${shared.footer}`}>
          Already have an account?{' '}
          <Link className={shared.switchLink} to="/login">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
