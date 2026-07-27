import { Link } from 'react-router-dom';

import { AuthLayout } from '@/components/AuthLayout';
import { TextField } from '@/components/TextField';
import { Button } from '@/components/Button';
import { useLoginPage } from './useLoginPage';
import styles from './LoginPage.module.css';

/** JSX only — logic comes from useLoginPage. */
export default function LoginPage() {
  const { form, errors, serverError, isLoading, onChange, onSubmit } = useLoginPage();

  return (
    <AuthLayout>
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <h2 className={styles.title}>Welcome back</h2>
        <p className={styles.subtitle}>Sign in to your provider account</p>

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
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={form.password}
          onChange={onChange}
          error={errors.password}
        />

        {serverError && <p className={styles.serverError}>{serverError}</p>}

        <Button className={styles.submit} type="submit" loading={isLoading}>
          Sign in
        </Button>

        <p className={styles.switch}>
          Don&apos;t have an account? <Link to="/register">Create one</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
