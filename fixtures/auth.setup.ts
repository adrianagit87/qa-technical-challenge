import { test as setup } from '@playwright/test';
import { DEMO_USER } from './test-data';

const AUTH_FILE = 'test-results/.auth/user.json';

/**
 * Setup de autenticación: hace login una sola vez y guarda
 * el storageState (cookies + localStorage) para reutilizar
 * en todos los tests que necesitan sesión activa.
 *
 * Esto elimina logins repetidos y acelera la suite.
 */
setup('autenticar usuario demo', async ({ page }) => {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[name="username"]', { timeout: 15000 });

  await page.fill('input[name="username"]', DEMO_USER.username);
  await page.fill('input[name="password"]', DEMO_USER.password);
  await page.click('input[type="submit"][value="Login"]');

  // Esperar redirección a /home — indicador confiable de login exitoso.
  // NO usar .topbar porque OSSN la muestra en TODAS las páginas (incluso sin sesión).
  await page.waitForURL('**/home**', { timeout: 15000 });

  // Guardar estado de sesión para los tests dependientes
  await page.context().storageState({ path: AUTH_FILE });
});
