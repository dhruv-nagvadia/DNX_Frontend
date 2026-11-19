import { Lock, Mail, Phone, User } from 'lucide-react';
import { Link } from 'react-router-dom';

import { AlertBanner } from '@/components/AlertBanner';
import { Checkbox } from '@/components/Checkbox';
import { getPasswordStrength } from '@/components/PasswordField/strength';

import { AuthField, AuthSplitLayout, AuthSubmit, authCard as card } from '../AuthSplitLayout';
import { useRegisterPage } from './useRegisterPage';

/** Three-segment strength bar under the password field. */
function StrengthMeter({ value }: { value: string }) {
  const strength = getPasswordStrength(value);
  return (
    <div className={card.strength}>
      <div className={card.strengthTrack} aria-hidden="true">
        {[1, 2, 3].map((segment) => (
          <span
            key={segment}
            className={`${card.strengthSegment} ${
              strength.score >= segment ? card[`level${strength.score}`] : ''
            }`}
          />
        ))}
      </div>
      <span className={card.strengthLabel} aria-live="polite">
        {strength.label}
      </span>
    </div>
  );
}

/** JSX only — logic comes from useRegisterPage. */
export default function RegisterPage() {
  const { form, errors, serverError, accountExists, isLoading, onChange, onBlur, onSubmit } =
    useRegisterPage();

  return (
    <AuthSplitLayout
      headline="Grow your business with DNX"
      // SERVICES-ONLY: store/order copy disabled for launch — restore the commented original: subhead="List your services and products, take bookings and orders, and get paid."
      subhead="List your services, take bookings, and get paid."
    >
      <form className={card.card} onSubmit={onSubmit} noValidate>
        <header className={card.head}>
          <h2 className={card.title}>Create your account</h2>
          <p className={card.subtitle}>Start managing your business on DNX</p>
        </header>

        {serverError && (
          <AlertBanner tone="error">
            {serverError}
            {/* An existing email is not a dead end — offer the way forward. */}
            {accountExists && (
              <>
                {' '}
                <Link className={card.link} to="/login">
                  Sign in instead
                </Link>
              </>
            )}
          </AlertBanner>
        )}

        <div className={card.fields}>
          <AuthField
            id="fullName"
            name="fullName"
            label="Full name"
            icon={User}
            autoComplete="name"
            autoFocus
            placeholder="Your name"
            value={form.fullName}
            onChange={onChange}
            onBlur={onBlur}
            error={errors.fullName}
            disabled={isLoading}
          />

          <AuthField
            id="email"
            name="email"
            label="Email"
            icon={Mail}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@business.com"
            value={form.email}
            onChange={onChange}
            onBlur={onBlur}
            error={errors.email}
            disabled={isLoading}
          />

          <AuthField
            id="phone"
            name="phone"
            label="Phone"
            icon={Phone}
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

          {/* Stacked: two columns leave too little room for icon + toggle + placeholder. */}
          <AuthField
            id="password"
            name="password"
            label="Password"
            icon={Lock}
            passwordToggle
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={form.password}
            onChange={onChange}
            onBlur={onBlur}
            error={errors.password}
            disabled={isLoading}
          >
            <StrengthMeter value={form.password} />
          </AuthField>

          <AuthField
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm password"
            icon={Lock}
            passwordToggle
            autoComplete="new-password"
            placeholder="Re-enter your password"
            value={form.confirmPassword}
            onChange={onChange}
            onBlur={onBlur}
            error={errors.confirmPassword}
            disabled={isLoading}
          />
        </div>

        {/* Legal links open in a new tab so reading them never discards the form. */}
        <Checkbox
          name="acceptTerms"
          checked={form.acceptTerms}
          onChange={onChange}
          error={errors.acceptTerms}
          disabled={isLoading}
          label={
            <span className={card.terms}>
              I agree to the{' '}
              <a href="/terms" target="_blank" rel="noreferrer">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" target="_blank" rel="noreferrer">
                Privacy Policy
              </a>
              , and the{' '}
              <a href="/refund-policy" target="_blank" rel="noreferrer">
                Refund &amp; Cancellation Policy
              </a>
            </span>
          }
        />

        <AuthSubmit loading={isLoading} loadingText="Creating your account…">
          Create account
        </AuthSubmit>

        <p className={card.switch}>
          Already have an account?{' '}
          <Link className={card.link} to="/login">
            Sign in
          </Link>
        </p>
      </form>
    </AuthSplitLayout>
  );
}
