import { BasePage } from './BasePage';

/**
 * ProfilePage: Page Object para el perfil de usuario en OSSN.
 *
 * URL: /u/{username} (perfil publico)
 * URL: /u/{username}/edit (edicion de perfil)
 *
 * Verificado contra OSSN demo real (marzo 2026):
 * - Perfil publico muestra: nombre del usuario, avatar, tabs (Timeline, Friends, Photos)
 * - Edit profile tiene "Basic Settings" (First Name, Last Name) — NO tiene campo about/bio visible
 * - La demo NO permite editar el perfil del admin: muestra mensaje de restriccion al guardar
 */
export class ProfilePage extends BasePage {
  // Selectores con fallbacks — OSSN varia entre versiones
  private readonly profileName = '.profile-body h2, .profile-name, .ossn-owner-name, .user-fullname';
  private readonly firstNameInput = 'input[name="firstname"]';
  private readonly lastNameInput = 'input[name="lastname"]';
  // Selectores para mensajes del sistema OSSN (error, exito, restriccion)
  private readonly systemMessageSelectors = [
    '.ossn-system-messages',
    '.ossn-message-error',
    '.ossn-message-success',
    '.ossn-notification-messages',
    '.alert-danger',
    '.alert-success',
    '.error-message',
  ];

  async navigateToProfile(username = 'administrator'): Promise<void> {
    await this.navigateTo(`/u/${username}`);
    await this.page.waitForLoadState('domcontentloaded');
    // Esperar a que el nombre del perfil sea visible (indicador de carga completa)
    await this.page.locator(this.profileName).first()
      .waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
  }

  async navigateToEditProfile(username = 'administrator'): Promise<void> {
    await this.navigateTo(`/u/${username}/edit`);
    await this.page.waitForLoadState('domcontentloaded');
    // Esperar a que el formulario de edición cargue
    await this.page.locator(this.firstNameInput)
      .waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
  }

  async getProfileName(): Promise<string> {
    const name = this.page.locator(this.profileName).first();
    if (await name.isVisible({ timeout: 5000 }).catch(() => false)) {
      return (await name.textContent())?.trim() ?? '';
    }
    return '';
  }

  /**
   * Edita el campo First Name en Basic Settings.
   * OSSN no tiene campo "about/bio" visible en edicion basica.
   */
  async editFirstName(name: string): Promise<void> {
    const input = this.page.locator(this.firstNameInput);
    await input.waitFor({ state: 'visible', timeout: 10000 });
    await input.clear();
    await input.fill(name);
  }

  /**
   * Lee el valor actual del campo First Name en la pagina de edicion.
   */
  async getFirstNameValue(): Promise<string> {
    const input = this.page.locator(this.firstNameInput);
    if (await input.isVisible({ timeout: 5000 }).catch(() => false)) {
      return (await input.inputValue()) ?? '';
    }
    return '';
  }

  /**
   * Detecta mensajes del sistema OSSN despues de una accion (guardar, error, restriccion).
   * Retorna el texto del mensaje o null si no hay mensaje visible.
   */
  async getSystemMessage(): Promise<string | null> {
    for (const selector of this.systemMessageSelectors) {
      const el = this.page.locator(selector).first();
      if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
        const text = await el.textContent();
        if (text && text.trim().length > 0) {
          return text.trim();
        }
      }
    }
    return null;
  }

  /**
   * Verifica si la pagina de edicion muestra campos editables.
   */
  async isEditFormVisible(): Promise<boolean> {
    return this.page.locator(`${this.firstNameInput}, ${this.lastNameInput}`).first()
      .isVisible({ timeout: 10000 }).catch(() => false);
  }

  /**
   * Guarda los cambios del perfil. OSSN tiene un botón submit que puede
   * estar oculto (`.upload`) — buscamos uno visible con múltiples selectores.
   */
  async saveProfile(): Promise<void> {
    // Buscar un botón de submit VISIBLE (no el oculto .upload)
    const submitSelectors = [
      'input[type="submit"][value="Save"]',
      'input[type="submit"][value="Update"]',
      'button[type="submit"]:visible',
      '.btn-primary:visible',
      'input[type="submit"]:not(.upload)',
    ];

    for (const selector of submitSelectors) {
      const btn = this.page.locator(selector).first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click();
        await this.page.waitForLoadState('domcontentloaded');
        // Esperar respuesta del sistema (mensaje de éxito/error)
        await this.waitForSystemResponse();
        return;
      }
    }

    // Si ningún botón visible, buscar CUALQUIER submit visible
    const anySubmit = this.page.locator('input[type="submit"]');
    const count = await anySubmit.count();
    for (let i = 0; i < count; i++) {
      const btn = anySubmit.nth(i);
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await this.page.waitForLoadState('domcontentloaded');
        await this.waitForSystemResponse();
        return;
      }
    }

    // Último recurso: hacer submit del formulario directamente
    await this.page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) form.submit();
    });
    await this.page.waitForLoadState('domcontentloaded');
    await this.waitForSystemResponse();
  }

  /**
   * Espera a que OSSN muestre un mensaje del sistema después de una acción.
   * Reemplaza waitForTimeout con una espera basada en condiciones reales.
   */
  private async waitForSystemResponse(): Promise<void> {
    const messageSelector = this.systemMessageSelectors.join(', ');
    try {
      await this.page.locator(messageSelector).first()
        .waitFor({ state: 'visible', timeout: 5000 });
    } catch {
      // Si no aparece mensaje, esperar estabilidad del DOM
      await this.page.waitForLoadState('networkidle').catch(() => {});
    }
  }

  async isProfilePageVisible(): Promise<boolean> {
    const url = this.page.url();
    if (!url.includes('/u/')) return false;

    // Buscar indicadores de que la pagina de perfil cargo
    const hasName = await this.page.locator(this.profileName).first()
      .isVisible({ timeout: 5000 }).catch(() => false);
    const hasTabs = await this.page.getByText('Timeline', { exact: false })
      .first().isVisible({ timeout: 3000 }).catch(() => false);
    return hasName || hasTabs;
  }
}
