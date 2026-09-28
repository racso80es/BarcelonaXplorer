import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    include: ['../tests/**/*.test.{ts,tsx}', './**/*.test.{ts,tsx}'],
    setupFiles: [path.resolve(__dirname, 'vitest.setup.ts')],
    exclude: [
      ...configDefaults.exclude,
      '**/playwright-e2e/**',
      // E2E en vivo (JEV/Groq): fuera del cuádruple oráculo; usar npm run test:live
      '../tests/e2e/**/*.e2e.test.ts',
      // Integración MySQL: requiere DATABASE_URL; usar npm run test:integration
      '../tests/integration/**',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      'server-only': path.resolve(__dirname, 'node_modules/next/dist/compiled/server-only/empty.js'),
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      '@testing-library/react': path.resolve(__dirname, 'node_modules/@testing-library/react'),
    },
  },
  server: {
    fs: {
      allow: ['..'],
    },
  },
});
