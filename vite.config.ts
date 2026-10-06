import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// One port per env (--mode development|staging|production) so all three can
// run side by side locally: dev server on 5173/5174/5175, `vite preview` of a
// built bundle on 4173/4174/4175.
const PORTS: Record<string, { dev: number; preview: number }> = {
  development: { dev: 5173, preview: 4173 },
  staging: { dev: 5174, preview: 4174 },
  production: { dev: 5175, preview: 4175 },
};

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const ports = PORTS[mode] ?? PORTS.development;
  return {
    plugins: [react()],
    resolve: {
      alias: {
        // Mirrors tsconfig.json "paths".
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: ports.dev,
    },
    preview: {
      port: ports.preview,
    },
  };
});
