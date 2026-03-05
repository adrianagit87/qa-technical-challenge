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
    await test.step('Navegar a la pagina de login', async () => {
      await loginPage.navigate();

      const formVisible = await loginPage.isLoginFormVisible();
      expect(formVisible, 'El formulario de login debe estar visible en /login').toBeTruthy();
    });

    await test.step('Ingresar credenciales y hacer login', async () => {
      await loginPage.login(DEMO_USER.username, DEMO_USER.password);

      // Esperar redireccion a /home — indicador confiable de login exitoso
      try {
        await page.waitForURL('**/home**', { timeout: 30000 });
      } catch {
        await page.waitForSelector('#ossn-wall-form, .ossn-menu-dropdown', { timeout: 10000 });
      }
    });

    await test.step('Verificar redireccion exitosa a /home', async () => {
      const currentUrl = page.url();
      expect(
        currentUrl,
        'Despues del login debe redirigir a /home (news feed)'
      ).toContain('/home');

      await page.screenshot({ path: 'evidencias/manual/TC-03-login-exitoso.png', fullPage: true });
    });
  });

  test('debe validar response del backend via network interception', async ({ page, loginPage }) => {
    await test.step('Interceptar request de autenticacion y hacer login', async () => {
      const responsePromise = page.waitForResponse(
        response => response.url().includes('/action/user/login'),
        { timeout: 15000 }
      );

      await loginPage.navigate();
      await loginPage.login(DEMO_USER.username, DEMO_USER.password);

      const response = await responsePromise;

      expect(
        response.status(),
        `El servidor debe responder con 200-302 al login. Status actual: ${response.status()}`
      ).toBeLessThan(400);
    });

    await test.step('Verificar redireccion y capturar evidencia', async () => {
      await page.waitForURL('**/home**', { timeout: 15000 });
      await page.screenshot({ path: 'evidencias/manual/TC-03-login-network.png', fullPage: true });
    });
  });
});

test.describe('TC-04: Login con credenciales invalidas', () => {

  test('debe rechazar login con password incorrecto', async ({ page, loginPage }) => {
    await test.step('Intentar login con password incorrecto', async () => {
      await loginPage.navigate();
      await loginPage.login(DEMO_USER.username, 'wrongpassword123');
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Verificar que no se creo sesion', async () => {
      const isLoggedIn = await loginPage.isLoggedIn();
      expect(isLoggedIn, 'No debe iniciar sesión con password incorrecto').toBeFalsy();
    });

    await test.step('Verificar mensaje de error y seguridad', async () => {
      const errorMessage = await loginPage.getErrorMessage();

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
  });

  test('debe rechazar login con usuario inexistente', async ({ page, loginPage }) => {
    await test.step('Intentar login con usuario inexistente', async () => {
      await loginPage.navigate();
      await loginPage.login('usuario_inexistente_99999', 'anypassword');
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Verificar que no se creo sesion', async () => {
      const isLoggedIn = await loginPage.isLoggedIn();
      expect(isLoggedIn, 'No debe iniciar sesión con usuario inexistente').toBeFalsy();

      await page.screenshot({ path: 'evidencias/manual/TC-04-usuario-inexistente.png', fullPage: true });
    });
  });

  test('debe rechazar login con campos vacios', async ({ page, loginPage }) => {
    await test.step('Intentar login con campos vacios', async () => {
      await loginPage.navigate();
      await loginPage.clickLogin();
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Verificar que no se creo sesion', async () => {
      const isLoggedIn = await loginPage.isLoggedIn();

      if (isLoggedIn) {
        test.info().annotations.push({
          type: 'bug',
          description: 'BUG: OSSN permite login con campos vacíos — crea sesión sin credenciales.',
        });
      }

      expect(isLoggedIn, 'No debe autenticarse con campos vacíos').toBeFalsy();

      await page.screenshot({ path: 'evidencias/manual/TC-04-campos-vacios.png', fullPage: true });
    });
  });
});
