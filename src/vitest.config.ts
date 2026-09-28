import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    include: ['./**/*.test.{ts,tsx}'],
    setupFiles: [path.resolve(__dirname, 'vitest.setup.ts')],
    exclude: [
      ...configDefaults.exclude,
      '**/playwright-e2e/**',
      '**/*.live.test.ts',
      '**/*.integration.test.ts',
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
