import { test, expect } from '../../fixtures/page-fixtures';
import { generateUniqueEmail, generateUniqueUsername, validUser } from '../../fixtures/test-data';

/**
 * TC-01: Registro exitoso con datos validos.
 *
 * Verifica el flujo completo de creacion de cuenta en OSSN.
 * El formulario requiere: firstname, lastname, email, email_re,
 * username, password, birthdate, gender, gdpr_agree.
 *
 * NOTA: En la demo publica de OSSN, el registro puede:
 * - Redirigir a /home (registro + auto-login)
 * - Permanecer en / sin error (registro exitoso pero sin auto-login)
 * - Mostrar error si hay un problema de validacion
 */
test.describe('TC-01: Registro exitoso', () => {

  test('debe crear una cuenta con datos validos', async ({ page, registerPage }) => {
    const testEmail = generateUniqueEmail();
    const testUsername = generateUniqueUsername();

    await test.step('Navegar a la pagina de registro', async () => {
      await registerPage.navigate();

      const formVisible = await registerPage.isRegistrationFormVisible();
      expect(formVisible, 'El formulario de registro debe estar visible en /').toBeTruthy();
    });

    await test.step('Completar formulario con datos validos', async () => {
      await registerPage.registerUser({
        firstName: validUser.firstName,
        lastName: validUser.lastName,
        email: testEmail,
        password: validUser.password,
        gender: validUser.gender,
        username: testUsername,
        birthdate: validUser.birthdate,
      });

      // Esperar a que OSSN procese el formulario
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('load').catch(() => {});
    });

    await test.step('Verificar resultado del registro', async () => {
      // Verificar que NO hay mensaje de error
      const errorMessage = await registerPage.getErrorMessage();
      expect(
        errorMessage,
        `El registro no debe mostrar errores. Error encontrado: "${errorMessage}"`
      ).toBeNull();

      // Verificar resultado: redireccion a /home O permanencia en / sin error
      const currentUrl = page.url();
      const wasRedirectedToHome = currentUrl.includes('/home');

      if (wasRedirectedToHome) {
        console.log('Registro exitoso: redireccion a /home');
      } else {
        console.log(`Registro completado sin redireccion. URL: ${currentUrl}`);
        const pageText = await page.textContent('body') ?? '';
        const hasError = pageText.toLowerCase().includes('error') ||
                         pageText.toLowerCase().includes('already taken') ||
                         pageText.toLowerCase().includes('already exists');
        expect(
          hasError,
          'No debe haber mensajes de error visibles en la pagina'
        ).toBeFalsy();
      }

      await page.screenshot({ path: 'evidencias/manual/TC-01-registro-exitoso.png', fullPage: true });

      test.info().annotations.push({
        type: 'test-data',
        description: `Email: ${testEmail}, Username: ${testUsername}`,
      });
    });
  });
});
