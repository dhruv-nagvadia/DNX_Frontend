import { ArrowRight, KeyRound } from 'lucide-react';
import { Link } from 'react-router-dom';

import { AlertBanner } from '@/components/AlertBanner';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/Button';
import { PasswordField } from '@/components/PasswordField';
import { TextField } from '@/components/TextField';

import shared from '../AuthForm.module.css';
import { useForgotPasswordPage } from './useForgotPasswordPage';

/** JSX only — logic comes from useForgotPasswordPage. */
export default function ForgotPasswordPage() {
  const {
    step,
    emailForm,
    emailErrors,
    resetForm,
    resetErrors,
    serverError,
    notice,
    isLoading,
    onEmailChange,
    onResetChange,
    sendCode,
    submitReset,
    backToEmail,
  } = useForgotPasswordPage();

  return (
    <AuthLayout>
      {step === 'email' ? (
        <form className={shared.form} onSubmit={sendCode} noValidate>
          <header className={shared.head}>
            <span className={shared.eyebrow}>
              <KeyRound size={13} aria-hidden="true" />
              Reset password
            </span>
            <h2 className={shared.title}>Forgot your password?</h2>
            <p className={shared.subtitle}>
              Enter the email on your account and we&apos;ll send you a 6-digit code.
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
              value={emailForm.email}
              onChange={onEmailChange}
              error={emailErrors.email}
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            fullWidth
            loading={isLoading}
            loadingText="Sending…"
            iconRight={<ArrowRight size={18} aria-hidden="true" />}
          >
            Send code
          </Button>

          <p className={`${shared.switch} ${shared.footer}`}>
            <Link className={shared.switchLink} to="/login">
              Back to sign in
            </Link>
          </p>
        </form>
      ) : (
        <form className={shared.form} onSubmit={submitReset} noValidate>
          <header className={shared.head}>
            <span className={shared.eyebrow}>
              <KeyRound size={13} aria-hidden="true" />
              Reset password
            </span>
            <h2 className={shared.title}>Enter your code</h2>
            <p className={shared.subtitle}>
              We sent a 6-digit code to {emailForm.email}. Enter it below with your new password.
            </p>
          </header>

          {notice && <AlertBanner tone="success">{notice}</AlertBanner>}
          {serverError && <AlertBanner tone="error">{serverError}</AlertBanner>}

          <div className={shared.fields}>
            <TextField
              dense
              label="6-digit code"
              name="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              placeholder="123456"
              maxLength={6}
              value={resetForm.otp}
              onChange={onResetChange}
              error={resetErrors.otp}
              disabled={isLoading}
            />

            <PasswordField
              dense
              label="New password"
              name="newPassword"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={resetForm.newPassword}
              onChange={onResetChange}
              error={resetErrors.newPassword}
              disabled={isLoading}
            />

            <PasswordField
              dense
              label="Confirm new password"
              name="confirmPassword"
              autoComplete="new-password"
              placeholder="Re-enter your new password"
              value={resetForm.confirmPassword}
              onChange={onResetChange}
              error={resetErrors.confirmPassword}
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            fullWidth
            loading={isLoading}
            loadingText="Resetting…"
            iconRight={<ArrowRight size={18} aria-hidden="true" />}
          >
            Reset password
          </Button>

          <p className={`${shared.switch} ${shared.footer}`}>
            <button
              type="button"
              className={shared.switchLink}
              onClick={backToEmail}
              style={{ background: 'none', border: 'none', padding: 0, font: 'inherit' }}
            >
              Use a different email
            </button>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
