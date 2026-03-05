import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';

config(); // Carga .env si existe; no-op si no hay archivo

const AUTH_FILE = 'test-results/.auth/user.json';

/**
 * Configuración de Playwright para el reto técnico.
 *
 * Arquitectura de proyectos:
 * - setup: Login una vez y guarda storageState (cookies + localStorage).
 * - auth-tests: Registro y login — NO dependen del setup (prueban el flujo desde cero).
 * - authenticated: Social, a11y, network, profile, messaging — usan storageState.
 *
 * BASE_URL configurable:
 * Por defecto apunta a la demo pública de OSSN. Si la demo está protegida
 * por Cloudflare (ver README § Limitaciones), se puede apuntar a una instancia
 * local o alternativa cambiando BASE_URL en el archivo .env.
 *
 * Video: 'on' para la entrega (evidencia completa de cada test).
 * En producción usaría 'retain-on-failure' para optimizar storage.
 *
 * Timeouts: Más generosos que el default porque OSSN demo puede ser lenta.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 60000, // 60s por test — OSSN demo es lenta a veces
  expect: {
    timeout: 10000,
  },
  fullyParallel: false, // Secuencial — algunos tests dependen de estado (ej: usuario creado)
  retries: 1, // 1 retry para manejar flakiness de la demo
  reporter: [
    ['html', { open: 'never' }], // Reporte HTML interactivo
    ['list'], // Output en consola durante ejecución
  ],
  use: {
    baseURL: process.env['BASE_URL'] || 'https://demo.opensource-socialnetwork.org',
    video: 'on', // Graba TODOS los tests — evidencia para el reto
    screenshot: 'on', // Screenshot al final de cada test
    trace: 'retain-on-failure', // Trace completo solo cuando falla
    actionTimeout: 15000,
    navigationTimeout: 30000,
    // OSSN no tiene viewport responsive, usar desktop standard
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    // 1. Setup: Login una vez, guardar estado de sesión
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      testDir: './fixtures',
    },

    // 2. Auth tests: Registro y login (NO usan storageState — prueban el flujo completo)
    {
      name: 'auth-tests',
      testMatch: 'tests/auth/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },

    // 3. Authenticated tests: Todo lo que necesita sesión activa
    {
      name: 'authenticated',
      testMatch: [
        'tests/social/**/*.spec.ts',
        'tests/accessibility/**/*.spec.ts',
        'tests/api/**/*.spec.ts',
        'tests/profile/**/*.spec.ts',
        'tests/messaging/**/*.spec.ts',
      ],
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_FILE,
      },
    },
  ],
});
