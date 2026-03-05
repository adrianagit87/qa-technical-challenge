import { test, expect } from '../../fixtures/page-fixtures';
import { DEMO_USER } from '../../fixtures/test-data';

/**
 * Validación de requests de red via network interception.
 *
 * Selectores y endpoints verificados contra OSSN demo real:
 * - Login endpoint: /action/user/login (POST)
 * - Indicador de sesión: URL /home + menú de usuario
 * - Cookies de sesión: PHPSESSID u OSSN*
 *
 * NOTA: Estos tests están en el proyecto `authenticated` pero necesitan
 * hacer login manual. Se limpian las cookies al inicio de cada test
 * para evitar conflictos con storageState.
 */
test.describe('Validacion de Network Requests', () => {

  // Limpiar cookies inyectadas por storageState — estos tests hacen login manual
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('login: debe recibir respuesta valida del backend', async ({ page, loginPage }) => {
    const requests: { url: string; method: string; status?: number }[] = [];

    page.on('response', response => {
      requests.push({
        url: response.url(),
        method: response.request().method(),
        status: response.status(),
      });
    });

    await loginPage.navigate();
    await loginPage.login(DEMO_USER.username, DEMO_USER.password);

    // Esperar redirección a /home — indicador confiable de login exitoso
    await page.waitForURL('**/home**', { timeout: 15000 });

    console.log(`\n=== Network Analysis: Login ===`);
    console.log(`Total requests: ${requests.length}`);

    const authRequests = requests.filter(r =>
      r.url.includes('login') || r.url.includes('action/user')
    );
    console.log(`Auth-related: ${authRequests.length}`);
    authRequests.forEach(r => {
      console.log(`  ${r.method} ${r.url} -> ${r.status}`);
    });

    const serverErrors = requests.filter(r => r.status && r.status >= 500);
    expect(serverErrors.length, 'No debe haber errores 5xx durante el flujo de login').toBe(0);

    expect(
      authRequests.length,
      'Debe haber al menos una request relacionada con autenticación'
    ).toBeGreaterThan(0);

    await page.screenshot({ path: 'evidencias/manual/network-login.png', fullPage: true });
  });

  test('navegacion publica: sin errores 5xx en paginas principales', async ({ page }) => {
    const errors: { url: string; status: number }[] = [];

    page.on('response', response => {
      if (response.status() >= 500) {
        errors.push({ url: response.url(), status: response.status() });
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('load').catch(() => {});
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('load').catch(() => {});

    console.log(`\n=== Network: Server Errors en páginas públicas ===`);
    if (errors.length > 0) {
      errors.forEach(e => console.log(`  [${e.status}] ${e.url}`));
    } else {
      console.log('Sin errores de servidor — OK');
    }

    expect(errors.length, 'No debe haber errores 5xx en páginas públicas').toBe(0);

    await page.screenshot({ path: 'evidencias/manual/network-publico.png', fullPage: true });
  });

  test('login: debe establecer cookie de sesion', async ({ page, loginPage }) => {
    await loginPage.navigate();
    await loginPage.login(DEMO_USER.username, DEMO_USER.password);

    // Esperar redirección a /home — confirma login exitoso
    await page.waitForURL('**/home**', { timeout: 15000 });

    const cookies = await page.context().cookies();
    console.log(`\n=== Cookies post-login ===`);
    cookies.forEach(c => {
      console.log(`  ${c.name}: domain=${c.domain}, secure=${c.secure}, httpOnly=${c.httpOnly}`);
    });

    expect(cookies.length, 'Debe haber al menos una cookie establecida post-login').toBeGreaterThan(0);

    // Verificar cookies de sesión conocidas de OSSN (usa PHPSESSID)
    const sessionCookies = cookies.filter(c =>
      c.name.toLowerCase().includes('sess') || c.name.toLowerCase().includes('ossn')
    );

    if (sessionCookies.length > 0) {
      sessionCookies.forEach(cookie => {
        if (!cookie.httpOnly) {
          test.info().annotations.push({
            type: 'security',
            description: `Cookie "${cookie.name}" no tiene flag HttpOnly — vulnerable a XSS`,
          });
        }
      });
    }

    await page.screenshot({ path: 'evidencias/manual/network-cookies.png', fullPage: true });
  });
});
