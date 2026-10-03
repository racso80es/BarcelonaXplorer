import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    include: ['./**/*.test.{ts,tsx}'],
    setupFiles: [path.resolve(__dirname, 'vitest.setup.ts')],
    exclude: [
      ...configDefaults.exclude,
      '.next/**',
      '**/playwright-e2e/**',
      '**/*.live.test.ts',
      '**/telemetry-audit.integration.test.ts',
      'ia-gateway/**',
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
