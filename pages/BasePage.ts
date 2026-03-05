import { Page } from '@playwright/test';

/**
 * BasePage: Clase base para todos los Page Objects.
 *
 * Centraliza navegacion, esperas y validaciones comunes.
 * OSSN no tiene data-testid en sus elementos, asi que los selectores
 * usan combinaciones de CSS, name attributes y texto visible.
 * Esto es fragil pero es la realidad de testear una app que no fue
 * disenada para automatizacion.
 */
export class BasePage {
  constructor(protected page: Page) { }

  async navigateTo(path: string): Promise<void> {
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
  }

  /**
   * Verifica si el usuario tiene sesion activa.
   * En OSSN, el menu de usuario aparece cuando esta logueado.
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      await this.page.waitForSelector('.ossn-menu-dropdown, .topbar-menu-user', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Espera generica con mensaje descriptivo para debugging.
   * OSSN puede ser lenta — mejor ser explicito sobre que estamos esperando.
   */
  async waitForElement(selector: string, description: string, timeout = 10000): Promise<void> {
    await this.page.waitForSelector(selector, { timeout }).catch(() => {
      throw new Error(`Timeout esperando "${description}" (selector: ${selector}) después de ${timeout}ms`);
    });
  }

  /**
   * Busca mensajes de error en la pagina.
   * OSSN usa distintos selectores para errores segun el contexto,
   * asi que probamos varios patrones conocidos.
   */
  async getErrorMessage(): Promise<string | null> {
    try {
      const selectors = [
        '.ossn-message-error',
        '.alert-danger',
        '.error-message',
        '.ossn-system-messages .error',
        '.ossn-system-messages',
        '.ossn-notification-messages',
      ];
      for (const sel of selectors) {
        const el = this.page.locator(sel).first();
        if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
          return await el.textContent();
        }
      }
      return null;
    } catch { return null; }
  }

  async getPageTitle(): Promise<string> {
    return await this.page.title();
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }
}
