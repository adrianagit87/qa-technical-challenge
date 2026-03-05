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

  // Esperar redireccion a /home — indicador confiable de login exitoso.
  // OSSN demo puede ser lenta, usar timeout generoso.
  // Intentar waitForURL primero; si falla, verificar que el feed cargo.
  try {
    await page.waitForURL('**/home**', { timeout: 30000 });
  } catch {
    // Fallback: verificar que estamos logueados por presencia de elementos del feed
    await page.waitForSelector('#ossn-wall-form, .ossn-menu-dropdown', { timeout: 10000 });
  }

  await page.context().storageState({ path: AUTH_FILE });
});
