import { test, expect } from '../../fixtures/page-fixtures';
import * as path from 'path';
import * as fs from 'fs';

/**
 * TC-05: Publicar imagen con descripción en el feed.
 *
 * Flujo: Navigate to feed → Write post → Attach image → Submit → Verify
 * Selectores verificados contra OSSN demo real.
 *
 * Usa storageState del setup — no necesita login manual.
 */
test.describe('TC-05: Publicar imagen con descripcion', () => {

  test('debe crear un post con imagen y texto', async ({ page, feedPage }) => {
    await feedPage.navigate();

    // Verificar que el feed cargó
    await expect(
      page.locator('#ossn-wall-form'),
      'El formulario de post debe estar visible en /home'
    ).toBeVisible({ timeout: 10000 });

    // Verificar que la imagen de prueba existe
    const imagePath = path.resolve('fixtures/test-image.jpg');
    const imageExists = fs.existsSync(imagePath);

    if (!imageExists) {
      console.log('test-image.jpg no encontrada en fixtures/');
      test.skip(true, 'test-image.jpg no encontrada en fixtures/');
      return;
    }

    const postText = `Test post QA - ${Date.now()}`;

    await feedPage.createPostWithImage(postText, imagePath);

    // Verificar que el post aparece en el feed
    await page.waitForLoadState('networkidle');

    // Tomar screenshot como evidencia
    await page.screenshot({ path: 'evidencias/manual/TC-05-post-imagen.png', fullPage: true });

    // Verificar que el post se publicó exitosamente
    const postVisible = await feedPage.isPostVisible(postText);
    expect(
      postVisible,
      `El post con texto "${postText}" debe aparecer en el feed después de publicarlo`
    ).toBeTruthy();
  });
});
