import { test, expect } from '../../fixtures/page-fixtures';
import { generateUniqueEmail, generateUniqueUsername, validUser, invalidData } from '../../fixtures/test-data';

/**
 * TC-02: Registro con datos inválidos.
 *
 * Estos tests validan que OSSN rechace datos incorrectos.
 * NOTA IMPORTANTE: OSSN tiene validación débil — con frecuencia acepta datos
 * que debería rechazar. Cada test documenta este comportamiento como un BUG
 * con assertions que fallan, haciendo visible el defecto.
 */
test.describe('TC-02: Registro con datos invalidos', () => {

  test('debe rechazar registro con password debil (1 caracter)', async ({ page, registerPage }) => {
    const testEmail = generateUniqueEmail();
    const testUsername = generateUniqueUsername();

    await registerPage.navigate();

    await registerPage.registerUser({
      firstName: validUser.firstName,
      lastName: validUser.lastName,
      email: testEmail,
      password: invalidData.weakPassword,
      gender: validUser.gender,
      username: testUsername,
      birthdate: validUser.birthdate,
    });

    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Después del submit, verificar si la app lo aceptó o no
    const currentUrl = page.url();
    const wasRedirectedToHome = currentUrl.includes('/home');

    // Si la app aceptó el password débil, es un BUG
    if (wasRedirectedToHome) {
      test.info().annotations.push({
        type: 'bug',
        description: 'BUG-001: OSSN acepta passwords de 1 carácter sin validación de complejidad.',
      });
    }

    // Assertion: el sistema NO debe redirigir a /home con un password de 1 carácter
    expect(
      wasRedirectedToHome,
      'BUG-001: La app aceptó un password de 1 solo carácter. ' +
      'Debe requerir mínimo 6-8 caracteres para seguridad básica.'
    ).toBeFalsy();

    await page.screenshot({ path: 'evidencias/bugs/TC-02-password-debil.png', fullPage: true });
  });

  test('debe rechazar registro con campos vacios', async ({ page, registerPage }) => {
    await registerPage.navigate();

    // Intentar enviar el formulario sin llenar campos
    // Solo aceptamos GDPR para ver si la validación de campos funciona
    await registerPage.acceptGDPR();
    await registerPage.clickCreateAccount();

    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    const stayedOnRegister = currentUrl.endsWith('/') || currentUrl.includes('register');

    // La app debe permanecer en la página de registro
    expect(
      stayedOnRegister,
      `No debe registrar con campos vacíos. URL actual: ${currentUrl}`
    ).toBeTruthy();

    await page.screenshot({ path: 'evidencias/manual/TC-02-campos-vacios.png', fullPage: true });
  });

  test('debe rechazar registro con email invalido', async ({ page, registerPage }) => {
    const testUsername = generateUniqueUsername();

    await registerPage.navigate();

    await registerPage.registerUser({
      firstName: validUser.firstName,
      lastName: validUser.lastName,
      email: invalidData.invalidEmail,
      password: validUser.password,
      gender: validUser.gender,
      username: testUsername,
      birthdate: validUser.birthdate,
    });

    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    const wasRedirectedToHome = currentUrl.includes('/home');

    if (wasRedirectedToHome) {
      test.info().annotations.push({
        type: 'bug',
        description: 'BUG-002: OSSN acepta emails con formato inválido.',
      });
    }

    expect(
      wasRedirectedToHome,
      'La app no debe crear cuenta con email inválido "not-an-email"'
    ).toBeFalsy();

    await page.screenshot({ path: 'evidencias/bugs/TC-02-email-invalido.png', fullPage: true });
  });
});
