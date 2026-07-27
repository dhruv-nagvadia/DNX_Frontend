import { ReactElement } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { useAppSelector } from '@/redux/hooks';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import HomePage from '@/pages/home/HomePage';
import OnboardingPage from '@/pages/provider/OnboardingPage';
import DashboardPage from '@/pages/provider/DashboardPage';

/** Requires an authenticated user; otherwise sends to /login. */
function Protected({ children }: { children: ReactElement }) {
  const isLoggedIn = useAppSelector((s) => s.user.isLoggedIn);
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

/** For /login and /register — if already signed in, bounce to the landing route. */
function PublicOnly({ children }: { children: ReactElement }) {
  const isLoggedIn = useAppSelector((s) => s.user.isLoggedIn);
  return isLoggedIn ? <Navigate to="/" replace /> : children;
}

/** Landing route ("/"): sends each role to the right place. */
function RootLanding() {
  const { isLoggedIn, currentUser } = useAppSelector((s) => s.user);
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (currentUser?.role === 'PROVIDER') return <Navigate to="/dashboard" replace />;
  return <HomePage />;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <PublicOnly>
        <LoginPage />
      </PublicOnly>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicOnly>
        <RegisterPage />
      </PublicOnly>
    ),
  },
  {
    path: '/onboarding',
    element: (
      <Protected>
        <OnboardingPage />
      </Protected>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <Protected>
        <DashboardPage />
      </Protected>
    ),
  },
  {
    path: '/',
    element: <RootLanding />,
  },
  // Any unknown path falls back to the landing route.
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
