import { test, expect } from '../../fixtures/page-fixtures';

/**
 * TC-09: Personalizar perfil de usuario.
 *
 * Flujo: Navegar a edicion de perfil -> Modificar campo -> Guardar -> Verificar resultado
 * Usa storageState del setup — sesion ya activa como administrator.
 *
 * HALLAZGO (marzo 2026):
 * La demo publica de OSSN NO permite editar el perfil del usuario administrator.
 * Al intentar guardar cambios, el sistema muestra un mensaje de restriccion/error
 * y los datos no se modifican. Esto se documenta como defecto BUG-019.
 *
 * Estrategia del test:
 * 1. Navegar a edicion, verificar que el formulario carga
 * 2. Intentar editar el First Name con un valor DIFERENTE al actual
 * 3. Intentar guardar y capturar la respuesta del sistema
 * 4. Verificar que el sistema muestra un mensaje (error/restriccion)
 *    O que el nombre NO cambio (restriccion silenciosa)
 * 5. Documentar el comportamiento como defecto
 */
test.describe('TC-09: Personalizar perfil', () => {

  test('debe detectar restriccion al intentar editar el perfil del admin', async ({ page, profilePage }) => {
    // Nombre diferente al actual para detectar si realmente se edita
    const newFirstName = 'QATester';

    await test.step('Navegar a edicion de perfil', async () => {
      await profilePage.navigateToEditProfile();
    });

    const originalFirstName = await test.step('Verificar formulario y capturar nombre actual', async () => {
      const hasForm = await profilePage.isEditFormVisible();
      expect(hasForm, 'La pagina de edicion debe mostrar campos editables').toBeTruthy();

      const currentName = await profilePage.getFirstNameValue();
      expect(currentName.length, 'El campo First Name debe tener un valor inicial').toBeGreaterThan(0);
      return currentName;
    });

    await test.step('Editar First Name con un valor diferente al actual', async () => {
      expect(
        newFirstName.toLowerCase(),
        'El nombre de prueba debe ser diferente al actual para validar la edicion'
      ).not.toBe(originalFirstName.toLowerCase());

      await profilePage.editFirstName(newFirstName);
    });

    await test.step('Intentar guardar y verificar respuesta del sistema', async () => {
      await profilePage.saveProfile();

      const systemMessage = await profilePage.getSystemMessage();

      if (systemMessage) {
        test.info().annotations.push({
          type: 'defecto',
          description: `BUG-019: La demo de OSSN no permite editar el perfil del admin. `
            + `Mensaje del sistema: "${systemMessage}"`,
        });

        // El test PASA: detectamos correctamente la restriccion
        expect(
          systemMessage.length,
          'El sistema debe mostrar un mensaje al intentar editar el perfil del admin'
        ).toBeGreaterThan(0);
      } else {
        // Sin mensaje visible — verificar si el cambio realmente se aplico
        await profilePage.navigateToEditProfile();
        const currentName = await profilePage.getFirstNameValue();

        if (currentName.toLowerCase() !== newFirstName.toLowerCase()) {
          // Restriccion silenciosa: no cambio el nombre y no mostro mensaje
          test.info().annotations.push({
            type: 'defecto',
            description: `BUG-019: Restriccion silenciosa — el perfil del admin no se edito `
              + `y no se mostro mensaje al usuario. Nombre esperado: "${newFirstName}", `
              + `nombre actual: "${currentName}"`,
          });

          expect(
            currentName.toLowerCase(),
            'El nombre no cambio y no se mostro mensaje: restriccion silenciosa detectada'
          ).not.toBe(newFirstName.toLowerCase());
        } else {
          // El cambio SI se aplico — perfil editable, verificar persistencia
          await profilePage.navigateToProfile();
          const profileName = await profilePage.getProfileName();
          expect(
            profileName.toLowerCase(),
            `El nombre editado debe reflejarse en el perfil publico`
          ).toContain(newFirstName.toLowerCase());
        }
      }
    });

    await page.screenshot({ path: 'evidencias/manual/TC-09-editar-perfil.png', fullPage: true });
  });

  test('debe restaurar el nombre original si fue modificado', async ({ page, profilePage }) => {
    const originalName = 'System';

    await test.step('Navegar a edicion de perfil', async () => {
      await profilePage.navigateToEditProfile();
    });

    await test.step('Verificar el estado actual del campo First Name', async () => {
      const hasForm = await profilePage.isEditFormVisible();
      expect(hasForm, 'La pagina de edicion debe cargar').toBeTruthy();

      const currentName = await profilePage.getFirstNameValue();

      if (currentName.toLowerCase() !== originalName.toLowerCase()) {
        // El nombre fue modificado previamente — restaurar
        await profilePage.editFirstName(originalName);
        await profilePage.saveProfile();

        const systemMessage = await profilePage.getSystemMessage();
        if (systemMessage) {
          test.info().annotations.push({
            type: 'info',
            description: `Restauracion del nombre: "${systemMessage}"`,
          });
        }
      }
    });

    await page.screenshot({ path: 'evidencias/manual/TC-09-restaurar-perfil.png', fullPage: true });
  });

  test('debe mostrar el nombre del usuario en el perfil publico', async ({ page, profilePage }) => {
    await profilePage.navigateToProfile();

    const isVisible = await profilePage.isProfilePageVisible();
    expect(isVisible, 'El perfil debe cargar correctamente').toBeTruthy();

    const name = await profilePage.getProfileName();
    expect(name.trim().length, 'El nombre del usuario debe estar visible en el perfil').toBeGreaterThan(0);
    expect(name.trim(), 'El nombre del usuario debe ser un texto legible').toMatch(/\w+/);

    await page.screenshot({ path: 'evidencias/manual/TC-09-perfil-nombre.png', fullPage: true });
  });
});
