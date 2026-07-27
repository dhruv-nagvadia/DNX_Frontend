import { RouterProvider } from 'react-router-dom';
import { router } from '@/routes';
import { useSessionBootstrap } from '@/hooks/useSessionBootstrap';

export default function App() {
  const authReady = useSessionBootstrap();

  if (!authReady) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-secondary)',
        }}
      >
        Loading…
      </div>
    );
  }

  return <RouterProvider router={router} />;
}
