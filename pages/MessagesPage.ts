import { BasePage } from './BasePage';

/**
 * MessagesPage: Page Object para mensajeria privada en OSSN.
 *
 * URL: /messages (bandeja de entrada con lista de conversaciones)
 * URL: /messages/message/{username} (conversacion individual)
 *
 * Estructura HTML verificada contra OSSN demo real (marzo 2026):
 * - Container: .ossn-messages > .ossn-widget.messages-recent
 * - Items: div.ossn-recent-message-item[data-guid][onclick="Ossn.redirect(...)"]
 * - Onclick ejecuta: Ossn.redirect('messages/message/{username}')
 * - Los items NO son <a> tags — son <div> con onclick
 */
export class MessagesPage extends BasePage {

  async navigateToInbox(): Promise<void> {
    await this.navigateTo('/messages');
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(2000);
  }

  /**
   * Abre la primera conversacion existente en el inbox.
   * OSSN usa div.ossn-recent-message-item con onclick="Ossn.redirect(...)"
   * Extraemos el username del onclick y navegamos directamente.
   */
  async openFirstConversation(): Promise<boolean> {
    await this.navigateToInbox();

    // Extraer la URL de la primera conversacion del atributo onclick
    const messageUrl = await this.page.evaluate(() => {
      const item = document.querySelector('.ossn-recent-message-item[onclick]');
      if (!item) return null;
      const onclick = item.getAttribute('onclick') || '';
      // onclick es: Ossn.redirect('messages/message/username');
      const match = onclick.match(/Ossn\.redirect\(['"](.+?)['"]\)/);
      return match ? match[1] : null;
    });

    if (messageUrl) {
      // Navegar directamente a la URL de la conversacion
      await this.navigateTo(`/${messageUrl}`);
      await this.page.waitForLoadState('domcontentloaded');
      await this.page.waitForTimeout(3000);
      return true;
    }

    // Fallback: click directo en el primer item
    const firstItem = this.page.locator('.ossn-recent-message-item').first();
    if (await firstItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstItem.click();
      await this.page.waitForLoadState('domcontentloaded');
      await this.page.waitForTimeout(3000);
      return true;
    }

    return false;
  }

  /**
   * Busca y llena el campo de mensaje.
   */
  async fillMessageText(text: string): Promise<boolean> {
    await this.page.waitForTimeout(1000);

    const selectors = [
      'textarea[name="message"]',
      'textarea',
      'input[name="message"]',
    ];

    for (const selector of selectors) {
      const field = this.page.locator(selector).first();
      if (await field.isVisible({ timeout: 3000 }).catch(() => false)) {
        await field.fill(text);
        return true;
      }
    }
    return false;
  }

  async clickSend(): Promise<void> {
    const selectors = [
      'input[type="submit"]',
      'button[type="submit"]',
      '.btn-primary',
    ];

    for (const selector of selectors) {
      const btn = this.page.locator(selector).first();
      if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await btn.click();
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForTimeout(2000);
        return;
      }
    }
  }

  async isInboxVisible(): Promise<boolean> {
    const currentUrl = this.page.url();
    if (currentUrl.includes('messages')) return true;

    const inbox = this.page.getByText('Inbox', { exact: false });
    return await inbox.isVisible({ timeout: 5000 }).catch(() => false);
  }
}
