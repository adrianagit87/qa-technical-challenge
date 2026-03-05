import * as path from 'path';
import { BasePage } from './BasePage';

/**
 * FeedPage: Page Object para el News Feed de OSSN.
 *
 * URL: /home (requiere login)
 * Selectores verificados contra OSSN demo real (marzo 2026):
 *
 * Post Form:
 * - Form ID: #ossn-wall-form
 * - Textarea: name="post", placeholder "What's on your mind?"
 * - File input: name="ossn_photo", accept="image/*"
 * - Submit: .ossn-wall-post (botón "Post")
 * - Privacy: name="privacy", id="ossn-wall-privacy"
 *
 * Logged-in indicators:
 * - Sidebar con "System Administrator" y "Edit Profile"
 * - Top bar con icons (friends, messages, notifications)
 */
export class FeedPage extends BasePage {
  // Selectores del formulario de post — verificados contra demo real
  private readonly postTextarea = '#ossn-wall-form textarea[name="post"]';
  private readonly postPhotoInput = '#ossn-wall-form input[name="ossn_photo"]';
  private readonly postSubmitBtn = '#ossn-wall-form .ossn-wall-post';

  // Indicadores de sesión activa
  private readonly topbar = '.topbar';

  async navigate(): Promise<void> {
    await this.navigateTo('/home');
    // Esperar a que el formulario de post sea visible
    await this.page.waitForSelector(this.postTextarea, { timeout: 15000 }).catch(() => {});
  }

  /**
   * Escribe texto en el campo "What's on your mind?"
   */
  async writePost(text: string): Promise<void> {
    await this.page.click(this.postTextarea);
    await this.page.fill(this.postTextarea, text);
  }

  /**
   * Sube una imagen al post usando el input file oculto.
   * No hace click en el trigger visual (ícono de cámara) — usa setInputFiles
   * directamente sobre el input[type="file"], que es más confiable.
   *
   * Espera a que la carga se procese antes de continuar.
   */
  async uploadImage(imagePath: string): Promise<void> {
    const absolutePath = path.resolve(imagePath);
    await this.page.setInputFiles(this.postPhotoInput, absolutePath);
    // Esperar a que OSSN procese la imagen (puede mostrar preview o terminar upload)
    // Intentar detectar preview; si no aparece, esperar estabilidad de red
    try {
      await this.page.locator('#ossn-wall-form img, .ossn-wall-photo-preview, .photo-preview').waitFor({ state: 'visible', timeout: 5000 });
    } catch {
      await this.page.waitForLoadState('networkidle').catch(() => {});
    }
  }

  /**
   * Hace click en "Post" y espera a que se procese.
   */
  async submitPost(): Promise<void> {
    const btn = this.page.locator(this.postSubmitBtn).first();
    await btn.click();
    // Esperar a que OSSN procese el post: interceptar la response del backend
    // o esperar a que el feed se recargue con nuevo contenido
    try {
      await this.page.waitForResponse(
        response => response.url().includes('/action/') && response.status() < 400,
        { timeout: 10000 }
      );
    } catch {
      // Fallback: esperar recarga del DOM si no se interceptó la response
      await this.page.waitForLoadState('domcontentloaded');
    }
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Flujo completo: escribir texto + adjuntar imagen + enviar.
   */
  async createPostWithImage(text: string, imagePath: string): Promise<void> {
    await this.writePost(text);
    await this.uploadImage(imagePath);
    await this.submitPost();
  }

  /**
   * Verifica si el feed muestra un post con el texto especificado.
   * Usa getByText en vez de selectores CSS — más confiable porque
   * OSSN cambia clases entre versiones pero el texto permanece.
   */
  async isPostVisible(text: string): Promise<boolean> {
    const post = this.page.getByText(text, { exact: false });
    return await post.isVisible({ timeout: 10000 }).catch(() => false);
  }
}
