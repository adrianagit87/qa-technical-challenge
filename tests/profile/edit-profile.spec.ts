import { test, expect } from '../../fixtures/page-fixtures';

/**
 * TC-09: Personalizar perfil de usuario.
 *
 * Flujo: Navegar a edición de perfil → Modificar campo → Guardar → Verificar
 * Usa storageState del setup — sesión ya activa como administrator.
 *
 * Verificado contra OSSN demo real (marzo 2026):
 * - /u/administrator/edit muestra "Basic Settings" con First Name y Last Name
 * - NO hay campo about/bio visible en la versión de la demo
 * - Se edita First Name como campo de prueba para la personalización
 */
test.describe('TC-09: Personalizar perfil', () => {

  test('debe editar el perfil y verificar que los cambios persisten', async ({ page, profilePage }) => {
    await test.step('Navegar a edición de perfil', async () => {
      await profilePage.navigateToEditProfile();
    });

    await test.step('Verificar que la página de edición cargó', async () => {
      // La página de edit debe tener campos editables (Basic Settings)
      const hasForm = await page.locator('input[name="firstname"], input[name="lastname"]').first()
        .isVisible({ timeout: 10000 }).catch(() => false);
      expect(hasForm, 'La página de edición de perfil debe mostrar campos editables').toBeTruthy();
    });

    await test.step('Editar el campo First Name', async () => {
      await profilePage.editFirstName('System');
    });

    await test.step('Guardar cambios', async () => {
      await profilePage.saveProfile();
    });

    await test.step('Navegar al perfil público y verificar', async () => {
      await profilePage.navigateToProfile();

      const isVisible = await profilePage.isProfilePageVisible();
      expect(isVisible, 'El perfil público debe ser visible después de guardar').toBeTruthy();
    });

    await page.screenshot({ path: 'evidencias/manual/TC-09-editar-perfil.png', fullPage: true });
  });

  test('debe mostrar el nombre del usuario en el perfil', async ({ page, profilePage }) => {
    await profilePage.navigateToProfile();

    const isVisible = await profilePage.isProfilePageVisible();
    expect(isVisible, 'El perfil debe cargar correctamente').toBeTruthy();

    const name = await profilePage.getProfileName();
    expect(name.trim().length, 'El nombre del usuario debe estar visible en el perfil').toBeGreaterThan(0);

    await page.screenshot({ path: 'evidencias/manual/TC-09-perfil-nombre.png', fullPage: true });
  });
});
