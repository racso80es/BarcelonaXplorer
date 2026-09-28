import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// Cargar variables de entorno locales (.env.local) para pruebas E2E e integración
const envLocalPath = path.resolve(__dirname, '.env.local');
if (fs.existsSync(envLocalPath) && typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(envLocalPath);
  } catch {
    // Continuar si no se puede leer
  }
}

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    include: ['../tests/**/*.test.{ts,tsx}', './**/*.test.{ts,tsx}'],
    exclude: [
      ...configDefaults.exclude,
      '**/playwright-e2e/**',
      // E2E en vivo (JEV/Groq): fuera del cuádruple oráculo; usar npm run test:live
      '../tests/e2e/**/*.e2e.test.ts',
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
