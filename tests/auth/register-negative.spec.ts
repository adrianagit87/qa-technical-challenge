import { test, expect } from '../../fixtures/page-fixtures';
import { generateUniqueEmail, generateUniqueUsername, validUser, invalidData } from '../../fixtures/test-data';

/**
 * TC-02: Registro con datos invalidos.
 *
 * Valida que OSSN rechace datos incorrectos mostrando mensajes de error.
 * Verificado manualmente contra OSSN demo (marzo 2026):
 * - Password < 5 chars: muestra "The password must be more than 5 characters"
 * - Email mal formado: muestra error de validacion
 * - Campos vacios: permanece en la pagina de registro
 * - BUG REAL: el campo email no permite escribir @ con el teclado
 */
test.describe('TC-02: Registro con datos invalidos', () => {

  test('debe rechazar registro con password menor a 5 caracteres', async ({ page, registerPage }) => {
    const testEmail = generateUniqueEmail();
    const testUsername = generateUniqueUsername();

    await registerPage.navigate();

    await registerPage.registerUser({
      firstName: validUser.firstName,
      lastName: validUser.lastName,
      email: testEmail,
      password: invalidData.weakPassword, // "a" — 1 caracter
      gender: validUser.gender,
      username: testUsername,
      birthdate: validUser.birthdate,
    });

    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // OSSN debe rechazar password < 5 chars y mostrar error
    const currentUrl = page.url();
    expect(
      currentUrl,
      'No debe redirigir a /home con password de 1 caracter'
    ).not.toContain('/home');

    // Verificar que OSSN muestra el mensaje de error esperado
    const errorMessage = await registerPage.getErrorMessage();
    const pageText = await page.textContent('body') ?? '';
    const hasPasswordError =
      errorMessage?.toLowerCase().includes('password') ||
      pageText.toLowerCase().includes('password must be more than');

    expect(
      hasPasswordError,
      'OSSN debe mostrar mensaje de error sobre la longitud del password'
    ).toBeTruthy();

    await page.screenshot({ path: 'evidencias/manual/TC-02-password-debil.png', fullPage: true });
  });

  test('debe rechazar registro con campos vacios', async ({ page, registerPage }) => {
    await registerPage.navigate();

    // Intentar enviar formulario sin llenar campos
    await registerPage.acceptGDPR();
    await registerPage.clickCreateAccount();

    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    const stayedOnRegister = currentUrl.endsWith('/') || currentUrl.includes('register') || !currentUrl.includes('/home');

    expect(
      stayedOnRegister,
      `No debe registrar con campos vacios. URL actual: ${currentUrl}`
    ).toBeTruthy();

    await page.screenshot({ path: 'evidencias/manual/TC-02-campos-vacios.png', fullPage: true });
  });

  test('debe rechazar registro con email invalido (sin formato correcto)', async ({ page, registerPage }) => {
    const testUsername = generateUniqueUsername();

    await registerPage.navigate();

    await registerPage.registerUser({
      firstName: validUser.firstName,
      lastName: validUser.lastName,
      email: invalidData.invalidEmail, // "not-an-email"
      password: validUser.password,
      gender: validUser.gender,
      username: testUsername,
      birthdate: validUser.birthdate,
    });

    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // OSSN debe rechazar email sin formato valido
    const currentUrl = page.url();
    expect(
      currentUrl,
      'No debe crear cuenta con email invalido "not-an-email"'
    ).not.toContain('/home');

    // Verificar que permanece en pagina de registro o muestra error
    const errorMessage = await registerPage.getErrorMessage();
    const stayedOnRegister = currentUrl.endsWith('/') || currentUrl.includes('register');
    expect(
      stayedOnRegister || errorMessage !== null,
      'Debe permanecer en registro o mostrar error para email invalido'
    ).toBeTruthy();

    await page.screenshot({ path: 'evidencias/manual/TC-02-email-invalido.png', fullPage: true });
  });
});
