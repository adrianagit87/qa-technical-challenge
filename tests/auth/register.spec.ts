import { test, expect } from '../../fixtures/page-fixtures';
import { generateUniqueEmail, generateUniqueUsername, validUser } from '../../fixtures/test-data';

/**
 * TC-01: Registro exitoso con datos válidos.
 *
 * Verifica el flujo completo de creación de cuenta en OSSN.
 * El formulario requiere: firstname, lastname, email, email_re,
 * username, password, birthdate, gender, gdpr_agree.
 */
test.describe('TC-01: Registro exitoso', () => {

  test('debe crear una cuenta con datos validos', async ({ page, registerPage }) => {
    const testEmail = generateUniqueEmail();
    const testUsername = generateUniqueUsername();

    await registerPage.navigate();

    // Verificar que el formulario de registro carga
    const formVisible = await registerPage.isRegistrationFormVisible();
    expect(formVisible, 'El formulario de registro debe estar visible en /').toBeTruthy();

    // Llenar todos los campos requeridos por OSSN
    await registerPage.registerUser({
      firstName: validUser.firstName,
      lastName: validUser.lastName,
      email: testEmail,
      password: validUser.password,
      gender: validUser.gender,
      username: testUsername,
      birthdate: validUser.birthdate,
    });

    // Esperar a que OSSN procese el formulario (NO usar networkidle — OSSN hace requests indefinidas)
    await page.waitForLoadState('domcontentloaded');
    // Dar tiempo a OSSN para procesar y redirigir
    await page.waitForTimeout(3000);

    // Verificar redirección post-registro (OSSN puede redirigir a /home o mostrar confirmación)
    const currentUrl = page.url();
    const wasRedirected = !currentUrl.endsWith('/');
    const errorMessage = await registerPage.getErrorMessage();

    // Si hay error, reportar exactamente cuál fue
    if (errorMessage) {
      console.log(`Error de registro: ${errorMessage}`);
    }

    // El registro es exitoso si: redirigió O no mostró error
    expect(
      wasRedirected || !errorMessage,
      `Registro falló. URL: ${currentUrl}, Error: ${errorMessage}`
    ).toBeTruthy();

    await page.screenshot({ path: 'evidencias/manual/TC-01-registro-exitoso.png', fullPage: true });

    test.info().annotations.push({
      type: 'test-data',
      description: `Email: ${testEmail}, Username: ${testUsername}`,
    });
  });
});
