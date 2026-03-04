import { test, expect } from '../../fixtures/page-fixtures';

/**
 * TC-09: Personalizar perfil de usuario.
 *
 * Flujo: Navegar a edicion de perfil -> Modificar campo -> Guardar -> Verificar persistencia
 * Usa storageState del setup — sesion ya activa como administrator.
 *
 * Verificado contra OSSN demo real (marzo 2026):
 * - /u/administrator/edit muestra "Basic Settings" con First Name y Last Name
 * - NO hay campo about/bio visible en la version de la demo
 * - Se edita First Name como campo de prueba para la personalizacion
 */
test.describe('TC-09: Personalizar perfil', () => {

  test('debe editar el perfil y verificar que los cambios persisten', async ({ page, profilePage }) => {
    const newFirstName = 'System';

    await test.step('Navegar a edicion de perfil', async () => {
      await profilePage.navigateToEditProfile();
    });

    await test.step('Verificar que la pagina de edicion cargo', async () => {
      const hasForm = await page.locator('input[name="firstname"], input[name="lastname"]').first()
        .isVisible({ timeout: 10000 }).catch(() => false);
      expect(hasForm, 'La pagina de edicion de perfil debe mostrar campos editables').toBeTruthy();
    });

    await test.step('Editar el campo First Name', async () => {
      await profilePage.editFirstName(newFirstName);
    });

    await test.step('Guardar cambios', async () => {
      await profilePage.saveProfile();
    });

    await test.step('Verificar persistencia — navegar al perfil publico', async () => {
      await profilePage.navigateToProfile();

      const isVisible = await profilePage.isProfilePageVisible();
      expect(isVisible, 'El perfil publico debe ser visible despues de guardar').toBeTruthy();

      // Verificar que el nombre editado se refleja en el perfil publico
      const profileName = await profilePage.getProfileName();
      expect(
        profileName.toLowerCase(),
        `El nombre en el perfil debe contener "${newFirstName}". Nombre actual: "${profileName}"`
      ).toContain(newFirstName.toLowerCase());
    });

    await page.screenshot({ path: 'evidencias/manual/TC-09-editar-perfil.png', fullPage: true });
  });

  test('debe mostrar el nombre del usuario en el perfil', async ({ page, profilePage }) => {
    await profilePage.navigateToProfile();

    const isVisible = await profilePage.isProfilePageVisible();
    expect(isVisible, 'El perfil debe cargar correctamente').toBeTruthy();

    const name = await profilePage.getProfileName();
    expect(name.trim().length, 'El nombre del usuario debe estar visible en el perfil').toBeGreaterThan(0);

    // Verificar que el nombre contiene algo razonable (no solo espacios o caracteres aleatorios)
    expect(
      name.trim(),
      'El nombre del usuario debe ser un texto legible'
    ).toMatch(/\w+/);

    await page.screenshot({ path: 'evidencias/manual/TC-09-perfil-nombre.png', fullPage: true });
  });
});
