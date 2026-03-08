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

      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('load').catch(() => { });
    });

    await test.step('Verificar resultado del registro', async () => {
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

        // OSSN muestra un mensaje de éxito cuando el registro funciona correctamente
        // pero no redirige a /home (requiere activación por email).
        // Usar innerText (solo texto visible) en vez de textContent (que incluye
        // scripts y elementos ocultos con cadenas como "ossn-signup-errors").
        const visibleText = (await page.innerText('body')).toLowerCase();

        const isSuccessMessage =
          visibleText.includes('account has been registered') ||
          visibleText.includes('cuenta ha sido registrada') ||
          visibleText.includes('activation email');

        if (isSuccessMessage) {
          console.log('Registro exitoso: mensaje de activación por email detectado');
        } else {
          const hasError = visibleText.includes('already taken') ||
            visibleText.includes('already exists') ||
            visibleText.includes('username is not valid') ||
            visibleText.includes('email is not valid');

          // Verificar también el contenedor de errores específico de OSSN
          const ossnErrorVisible = await page.locator('#ossn-signup-errors')
            .isVisible({ timeout: 2000 }).catch(() => false);

          expect(
            hasError || ossnErrorVisible,
            'No debe haber mensajes de error visibles en la pagina'
          ).toBeFalsy();
        }
      }

      await page.screenshot({ path: 'evidencias/manual/TC-01-registro-exitoso.png', fullPage: true });

      test.info().annotations.push({
        type: 'test-data',
        description: `Email: ${testEmail}, Username: ${testUsername}`,
      });
    });
  });
});
