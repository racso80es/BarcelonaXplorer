import { configDefaults, defineConfig } from 'vitest/config';

// Axioma I: tests colocalizados en src/. `dist/` (salida de `tsc`) contiene copias
// compiladas de los *.test.ts y no debe ejecutarse como suite duplicada.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: [...configDefaults.exclude, 'dist/**'],
  },
});
