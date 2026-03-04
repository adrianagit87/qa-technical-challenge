import { test, expect } from '../../fixtures/page-fixtures';
import { DEMO_USER } from '../../fixtures/test-data';

/**
 * TC-03: Login exitoso con credenciales válidas.
 * TC-04: Login con credenciales inválidas (password incorrecto, usuario inexistente, campos vacíos).
 *
 * Selectores verificados contra OSSN demo real (marzo 2026):
 * - Form: input[name="username"], input[name="password"]
 * - Submit: input[type="submit"][value="Login"]
 * - Indicador de sesión: URL /home + menú de usuario (NO usar .topbar — visible en TODAS las páginas)
 */
test.describe('TC-03: Login exitoso', () => {

  test('debe iniciar sesion con credenciales validas', async ({ page, loginPage }) => {
    await loginPage.navigate();

    // Verificar que el formulario de login está visible
    const formVisible = await loginPage.isLoginFormVisible();
    expect(formVisible, 'El formulario de login debe estar visible en /login').toBeTruthy();

    await loginPage.login(DEMO_USER.username, DEMO_USER.password);

    // Esperar redireccion a /home — indicador confiable de login exitoso.
    // OSSN demo puede ser lenta, usar timeout generoso.
    try {
      await page.waitForURL('**/home**', { timeout: 30000 });
    } catch {
      // Fallback: verificar que el feed cargo (OSSN ya redirigió pero lento)
      await page.waitForSelector('#ossn-wall-form, .ossn-menu-dropdown', { timeout: 10000 });
    }

    // Verificar URL final
    const currentUrl = page.url();
    expect(
      currentUrl,
      'Despues del login debe redirigir a /home (news feed)'
    ).toContain('/home');

    await page.screenshot({ path: 'evidencias/manual/TC-03-login-exitoso.png', fullPage: true });
  });

  test('debe validar response del backend via network interception', async ({ page, loginPage }) => {
    // Interceptar la respuesta del servidor al login
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/action/user/login'),
      { timeout: 15000 }
    );

    await loginPage.navigate();
    await loginPage.login(DEMO_USER.username, DEMO_USER.password);

    const response = await responsePromise;

    // Verificar que el servidor respondió correctamente
    expect(
      response.status(),
      `El servidor debe responder con 200-302 al login. Status actual: ${response.status()}`
    ).toBeLessThan(400);

    // Esperar redirección a /home — confirma login exitoso
    await page.waitForURL('**/home**', { timeout: 15000 });
    await page.screenshot({ path: 'evidencias/manual/TC-03-login-network.png', fullPage: true });
  });
});

test.describe('TC-04: Login con credenciales invalidas', () => {

  test('debe rechazar login con password incorrecto', async ({ page, loginPage }) => {
    await loginPage.navigate();
    await loginPage.login(DEMO_USER.username, 'wrongpassword123');

    await page.waitForLoadState('domcontentloaded');

    // Verificar que NO tiene sesión activa usando el menú de usuario
    // (NO usar .topbar — visible en TODAS las páginas de OSSN)
    const isLoggedIn = await loginPage.isLoggedIn();
    expect(isLoggedIn, 'No debe iniciar sesión con password incorrecto').toBeFalsy();

    // Verificar que muestra algún tipo de error o se queda en login
    const errorMessage = await loginPage.getErrorMessage();

    // Verificación de seguridad: si hay mensaje de error, no debe revelar si el usuario existe
    if (errorMessage) {
      const lowerError = errorMessage.toLowerCase();
      expect(
        lowerError.includes('user does not exist') || lowerError.includes('usuario no existe'),
        'SEGURIDAD: El mensaje de error no debe revelar si el usuario existe (prevenir enumeración)'
      ).toBeFalsy();

      test.info().annotations.push({
        type: 'security',
        description: `Mensaje de error: "${errorMessage}"`,
      });
    }

    await page.screenshot({ path: 'evidencias/manual/TC-04-password-incorrecto.png', fullPage: true });
  });

  test('debe rechazar login con usuario inexistente', async ({ page, loginPage }) => {
    await loginPage.navigate();
    await loginPage.login('usuario_inexistente_99999', 'anypassword');

    await page.waitForLoadState('domcontentloaded');

    // Verificar que NO tiene sesión activa (menú de usuario NO debe aparecer)
    const isLoggedIn = await loginPage.isLoggedIn();
    expect(isLoggedIn, 'No debe iniciar sesión con usuario inexistente').toBeFalsy();

    await page.screenshot({ path: 'evidencias/manual/TC-04-usuario-inexistente.png', fullPage: true });
  });

  test('debe rechazar login con campos vacios', async ({ page, loginPage }) => {
    await loginPage.navigate();

    // Intentar login sin llenar campos
    await loginPage.clickLogin();

    await page.waitForLoadState('domcontentloaded');

    // Verificar que NO tiene sesión activa (menú de usuario NO debe aparecer).
    // OSSN puede redirigir a /home incluso con campos vacíos (bug conocido),
    // pero no debe crear una sesión autenticada real.
    const isLoggedIn = await loginPage.isLoggedIn();

    if (isLoggedIn) {
      // Si OSSN acepta login vacío → bug de seguridad
      test.info().annotations.push({
        type: 'bug',
        description: 'BUG: OSSN permite login con campos vacíos — crea sesión sin credenciales.',
      });
    }

    expect(isLoggedIn, 'No debe autenticarse con campos vacíos').toBeFalsy();

    await page.screenshot({ path: 'evidencias/manual/TC-04-campos-vacios.png', fullPage: true });
  });
});
