import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      // Umbral DoD 70 % sobre módulos con pruebas unitarias.
      // agenda/historia/pacientes/etc. se cubren por E2E (aún fuera de este job).
      include: [
        'src/app.controller.ts',
        'src/app.service.ts',
        'src/health/**/*.ts',
        'src/seguridad/**/*.ts',
      ],
      thresholds: {
        lines: 70,
        statements: 70,
      },
      // Bootstrap / wiring sin lógica de negocio.
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
