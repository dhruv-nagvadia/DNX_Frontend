import { ReactElement } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { useAppSelector } from '@/redux/hooks';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import HomePage from '@/pages/home/HomePage';
import DashboardPage from '@/pages/provider/DashboardPage';
import BusinessesPage from '@/pages/provider/BusinessesPage';
import BusinessFormPage from '@/pages/provider/BusinessFormPage';
import BusinessDetailPage from '@/pages/provider/BusinessDetailPage';
import ReviewsPage from '@/pages/provider/ReviewsPage';
import ProfilePage from '@/pages/provider/ProfilePage';
import SupportPage from '@/pages/provider/SupportPage';
import PrivacyPage from '@/pages/legal/PrivacyPage';
import TermsPage from '@/pages/legal/TermsPage';
import AdminLoginPage from '@/pages/admin/AdminLoginPage';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import AdminCouponsPage from '@/pages/admin/AdminCouponsPage';

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

/** Requires an ADMIN session; otherwise sends to the unlisted admin login. */
function RequireAdmin({ children }: { children: ReactElement }) {
  const { isLoggedIn, currentUser } = useAppSelector((s) => s.user);
  if (!isLoggedIn || currentUser?.role !== 'ADMIN') {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

/** For /admin/login — an already-signed-in admin skips straight to the console. */
function AdminPublicOnly({ children }: { children: ReactElement }) {
  const { isLoggedIn, currentUser } = useAppSelector((s) => s.user);
  return isLoggedIn && currentUser?.role === 'ADMIN' ? (
    <Navigate to="/admin/dashboard" replace />
  ) : (
    children
  );
}

/** Landing route ("/"): sends each role to the right place. */
function RootLanding() {
  const { isLoggedIn, currentUser } = useAppSelector((s) => s.user);
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (currentUser?.role === 'PROVIDER') return <Navigate to="/dashboard" replace />;
  if (currentUser?.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
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
    path: '/forgot-password',
    element: (
      <PublicOnly>
        <ForgotPasswordPage />
      </PublicOnly>
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
    path: '/businesses',
    element: (
      <Protected>
        <BusinessesPage />
      </Protected>
    ),
  },
  {
    path: '/businesses/new',
    element: (
      <Protected>
        <BusinessFormPage />
      </Protected>
    ),
  },
  {
    path: '/businesses/:id',
    element: (
      <Protected>
        <BusinessDetailPage />
      </Protected>
    ),
  },
  {
    path: '/businesses/:id/edit',
    element: (
      <Protected>
        <BusinessFormPage />
      </Protected>
    ),
  },
  {
    path: '/businesses/:id/reviews',
    element: (
      <Protected>
        <ReviewsPage />
      </Protected>
    ),
  },
  {
    path: '/profile',
    element: (
      <Protected>
        <ProfilePage />
      </Protected>
    ),
  },
  {
    path: '/support',
    element: (
      <Protected>
        <SupportPage />
      </Protected>
    ),
  },
  {
    path: '/admin/login',
    element: (
      <AdminPublicOnly>
        <AdminLoginPage />
      </AdminPublicOnly>
    ),
  },
  {
    path: '/admin/dashboard',
    element: (
      <RequireAdmin>
        <AdminDashboardPage />
      </RequireAdmin>
    ),
  },
  {
    path: '/admin/coupons',
    element: (
      <RequireAdmin>
        <AdminCouponsPage />
      </RequireAdmin>
    ),
  },
  {
    path: '/privacy',
    element: <PrivacyPage />,
  },
  {
    path: '/terms',
    element: <TermsPage />,
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
