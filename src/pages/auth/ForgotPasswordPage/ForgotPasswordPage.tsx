import { ArrowLeft, KeyRound, Lock, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

import { AlertBanner } from '@/components/AlertBanner';

import { AuthField, AuthSplitLayout, AuthSubmit, authCard as card } from '../AuthSplitLayout';
import { useForgotPasswordPage } from './useForgotPasswordPage';

function BackToSignIn() {
  return (
    <p className={card.switch}>
      <Link className={`${card.link} ${card.backLink}`} to="/login">
        <ArrowLeft size={18} aria-hidden="true" />
        Back to sign in
      </Link>
    </p>
  );
}

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
    <AuthSplitLayout
      headline="Get back to your business"
      subhead="Reset your password in a minute and pick up where you left off."
    >
      {step === 'email' ? (
        <form className={card.card} onSubmit={sendCode} noValidate>
          <header className={card.head}>
            <h2 className={card.title}>Forgot your password?</h2>
            <p className={card.subtitle}>
              Enter your email and we&apos;ll send you a 6-digit code.
            </p>
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
              value={emailForm.email}
              onChange={onEmailChange}
              error={emailErrors.email}
              disabled={isLoading}
            />
          </div>

          <AuthSubmit loading={isLoading} loadingText="Sending…">
            Send code
          </AuthSubmit>

          <BackToSignIn />
        </form>
      ) : (
        <form className={card.card} onSubmit={submitReset} noValidate>
          <header className={card.head}>
            <h2 className={card.title}>Enter your code</h2>
            <p className={card.subtitle}>We sent a code to {emailForm.email}</p>
          </header>

          {notice && <AlertBanner tone="success">{notice}</AlertBanner>}
          {serverError && <AlertBanner tone="error">{serverError}</AlertBanner>}

          <div className={card.fields}>
            <AuthField
              id="otp"
              name="otp"
              label="6-digit code"
              icon={KeyRound}
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

            <AuthField
              id="newPassword"
              name="newPassword"
              label="New password"
              icon={Lock}
              passwordToggle
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={resetForm.newPassword}
              onChange={onResetChange}
              error={resetErrors.newPassword}
              disabled={isLoading}
            />

            <AuthField
              id="confirmPassword"
              name="confirmPassword"
              label="Confirm new password"
              icon={Lock}
              passwordToggle
              autoComplete="new-password"
              placeholder="Re-enter your new password"
              value={resetForm.confirmPassword}
              onChange={onResetChange}
              error={resetErrors.confirmPassword}
              disabled={isLoading}
            />
          </div>

          <AuthSubmit loading={isLoading} loadingText="Resetting…">
            Reset password
          </AuthSubmit>

          <p className={card.switch}>
            Wrong email?{' '}
            <button
              type="button"
              className={`${card.link} ${card.linkButton}`}
              onClick={backToEmail}
            >
              Use a different email
            </button>
          </p>

          <BackToSignIn />
        </form>
      )}
    </AuthSplitLayout>
  );
}
