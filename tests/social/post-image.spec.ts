import { test, expect } from '../../fixtures/page-fixtures';
import * as path from 'path';
import * as fs from 'fs';

/**
 * TC-05: Publicar imagen con descripcion en el feed.
 *
 * Flujo: Navigate to feed -> Write post -> Attach image -> Submit -> Verify
 * Verifica TANTO el texto como la imagen en el post publicado.
 *
 * Usa storageState del setup — no necesita login manual.
 */
test.describe('TC-05: Publicar imagen con descripcion', () => {

  test('debe crear un post con imagen y texto', async ({ page, feedPage }) => {
    await feedPage.navigate();

    // Verificar que el feed cargo
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

    // Esperar a que el feed se actualice
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Tomar screenshot como evidencia
    await page.screenshot({ path: 'evidencias/manual/TC-05-post-imagen.png', fullPage: true });

    // Verificar que el TEXTO del post aparece en el feed
    const postVisible = await feedPage.isPostVisible(postText);
    expect(
      postVisible,
      `El post con texto "${postText}" debe aparecer en el feed despues de publicarlo`
    ).toBeTruthy();

    // Verificar que hay al menos una IMAGEN en el area de posts recientes
    // OSSN muestra las imagenes dentro de .ossn-wall-item o similar
    const hasImage = await page.locator('.ossn-wall-item img, .post-contents img, .activity-item img, img[src*="photo"], img[src*="ossn"]')
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    // Si no encontramos imagen con selectores especificos, buscar cualquier img en el feed
    if (!hasImage) {
      const feedImages = await page.locator('#activity-feed img, .ossn-wall-container img').count();
      console.log(`Imagenes encontradas en el feed: ${feedImages}`);
    }

    expect(
      hasImage,
      'El post debe incluir una imagen visible en el feed'
    ).toBeTruthy();
  });
});
