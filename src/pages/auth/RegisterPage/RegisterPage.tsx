import { Link } from 'react-router-dom';

import { AuthLayout } from '@/components/AuthLayout';
import { TextField } from '@/components/TextField';
import { Button } from '@/components/Button';
import { useRegisterPage } from './useRegisterPage';
import styles from './RegisterPage.module.css';

/** JSX only — logic comes from useRegisterPage. */
export default function RegisterPage() {
  const { form, errors, serverError, isLoading, onChange, onSubmit } = useRegisterPage();

  return (
    <AuthLayout>
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <h2 className={styles.title}>Create your account</h2>
        <p className={styles.subtitle}>Start listing your business on DNX</p>

        <TextField
          label="Full name"
          name="fullName"
          autoComplete="name"
          placeholder="Your name"
          value={form.fullName}
          onChange={onChange}
          error={errors.fullName}
        />

        <div className={styles.row}>
          <TextField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@business.com"
            value={form.email}
            onChange={onChange}
            error={errors.email}
          />
          <TextField
            label="Phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="9876543210"
            value={form.phone}
            onChange={onChange}
            error={errors.phone}
          />
        </div>

        <div className={styles.row}>
          <TextField
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            value={form.password}
            onChange={onChange}
            error={errors.password}
          />
          <TextField
            label="Confirm password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter password"
            value={form.confirmPassword}
            onChange={onChange}
            error={errors.confirmPassword}
          />
        </div>

        {serverError && <p className={styles.serverError}>{serverError}</p>}

        <Button className={styles.submit} type="submit" loading={isLoading}>
          Create account
        </Button>

        <p className={styles.switch}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
