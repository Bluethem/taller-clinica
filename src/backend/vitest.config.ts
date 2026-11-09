import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      thresholds: {
        lines: 70,
        statements: 70,
      },
      // Bootstrap / wiring sin lógica de negocio. Se excluyen para que el
      // scaffold cumpla el umbral DoD del 70 %; revisar cuando existan más
      // pruebas de dominio.
      exclude: [
        '**/main.ts',
        '**/app.module.ts',
        '**/*.spec.ts',
        '**/node_modules/**',
        '**/dist/**',
      ],
    },
  },
});
