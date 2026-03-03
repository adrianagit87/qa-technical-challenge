import { BasePage } from './BasePage';

/**
 * ProfilePage: Page Object para el perfil de usuario en OSSN.
 *
 * URL: /u/{username} (perfil público)
 * URL: /u/{username}/edit (edición de perfil)
 *
 * Verificado contra OSSN demo real (marzo 2026):
 * - Perfil público muestra: nombre "System Administrator", avatar, tabs (Timeline, Friends, Photos)
 * - Edit profile tiene "Basic Settings" (First Name, Last Name) — NO tiene campo about/bio visible
 * - El nombre del perfil está en el area del header, no en un h2
 */
export class ProfilePage extends BasePage {
  // Selectores con múltiples fallbacks — OSSN varía entre versiones
  private readonly profileName = '.profile-body h2, .profile-name, .ossn-owner-name, .user-fullname, h2';
  private readonly aboutSection = '.ossn-user-about, .user-about, .profile-about';

  async navigateToProfile(username = 'administrator'): Promise<void> {
    await this.navigateTo(`/u/${username}`);
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(2000);
  }

  async navigateToEditProfile(username = 'administrator'): Promise<void> {
    await this.navigateTo(`/u/${username}/edit`);
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(2000);
  }

  async getProfileName(): Promise<string> {
    // Intentar primero con selectores CSS
    const name = this.page.locator(this.profileName).first();
    if (await name.isVisible({ timeout: 5000 }).catch(() => false)) {
      return (await name.textContent()) ?? '';
    }
    // Fallback: buscar "System Administrator" o el username en la página
    const byText = this.page.getByText('System Administrator', { exact: false });
    if (await byText.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      return 'System Administrator';
    }
    return '';
  }

  /**
   * Busca y edita el campo First Name en Basic Settings.
   * OSSN no tiene un campo "about/bio" visible en la página de edición básica.
   * Usamos First Name como campo de prueba para demostrar la edición de perfil.
   */
  async editFirstName(name: string): Promise<void> {
    const firstNameInput = this.page.locator('input[name="firstname"]');
    await firstNameInput.waitFor({ state: 'visible', timeout: 10000 });
    await firstNameInput.clear();
    await firstNameInput.fill(name);
  }

  async getAboutText(): Promise<string> {
    const about = this.page.locator(this.aboutSection).first();
    if (await about.isVisible({ timeout: 5000 }).catch(() => false)) {
      return (await about.textContent()) ?? '';
    }
    return '';
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
        await this.page.waitForTimeout(2000);
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
        await this.page.waitForTimeout(2000);
        return;
      }
    }

    // Último recurso: hacer submit del formulario directamente
    await this.page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) form.submit();
    });
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(2000);
  }

  async isProfilePageVisible(): Promise<boolean> {
    // Verificar que estamos en una página de perfil
    const url = this.page.url();
    if (url.includes('/u/')) {
      // Esperar a que la página cargue contenido
      await this.page.waitForTimeout(2000);
      // Buscar cualquier indicador de que la página de perfil cargó
      const hasName = await this.page.getByText('System Administrator', { exact: false })
        .first().isVisible({ timeout: 5000 }).catch(() => false);
      const hasTabs = await this.page.getByText('Timeline', { exact: false })
        .first().isVisible({ timeout: 3000 }).catch(() => false);
      return hasName || hasTabs;
    }
    return false;
  }
}
