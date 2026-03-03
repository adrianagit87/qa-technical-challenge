import { BasePage } from './BasePage';

/**
 * MessagesPage: Page Object para mensajería privada en OSSN.
 *
 * URL: /messages (bandeja de entrada con lista de conversaciones)
 *
 * Verificado contra OSSN demo real (marzo 2026):
 * - /messages muestra "Inbox (0)" con lista de conversaciones
 * - Cada conversación muestra: avatar, nombre, último mensaje, timestamp
 * - Click en una conversación abre el chat en la misma página
 * - NO hay botón "New Message" ni URL /messages/send/{username}
 * - Para enviar, se clickea una conversación existente y se escribe
 */
export class MessagesPage extends BasePage {
  private readonly conversationItem = '.ossn-messages-list .ossn-message-item, .messages-inner a, .ossn-messages-container a';
  private readonly messageTextarea = 'textarea, .message-input textarea, input[name="message"]';
  private readonly sendButton = 'input[type="submit"], button[type="submit"], .btn-primary';

  async navigateToInbox(): Promise<void> {
    await this.navigateTo('/messages');
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(2000);
  }

  /**
   * Abre una conversación existente para enviar un mensaje.
   * En OSSN, la mensajería funciona clickeando en conversaciones del inbox.
   *
   * NOTA: `a[href*="message"]` matchea links del sidebar/topbar que están
   * fuera del viewport. Usamos evaluate() para clickear solo en el content area.
   */
  async openFirstConversation(): Promise<boolean> {
    await this.navigateToInbox();

    // Buscar un elemento de conversación en el inbox.
    // Las conversaciones muestran "X hours ago" — usamos eso para identificarlas.
    // Evitar usar a[href*="message"] porque matchea el sidebar link fuera del viewport.
    const clicked = await this.page.evaluate(() => {
      // Buscar cualquier elemento en el content area que tenga un avatar (img)
      // y esté posicionado debajo del topbar
      const elements = document.querySelectorAll('a, div, li');
      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        const text = el.textContent || '';
        // Conversaciones tienen timestamps ("hours ago", "minutes ago")
        // y están en el content area (debajo del topbar y con tamaño razonable)
        if (rect.top > 60 && rect.top < 400 && rect.height > 30 && rect.width > 200 &&
            text.match(/\d+\s+(hours?|minutes?|days?|seconds?)\s+ago/)) {
          (el as HTMLElement).click();
          return true;
        }
      }
      return false;
    });

    if (clicked) {
      await this.page.waitForLoadState('domcontentloaded');
      await this.page.waitForTimeout(2000);
    }
    return clicked;
  }

  /**
   * Busca y llena el campo de mensaje con múltiples selectores fallback.
   */
  async fillMessageText(text: string): Promise<boolean> {
    const textarea = this.page.locator(this.messageTextarea).first();
    if (await textarea.isVisible({ timeout: 5000 }).catch(() => false)) {
      await textarea.fill(text);
      return true;
    }
    return false;
  }

  async clickSend(): Promise<void> {
    const btn = this.page.locator(this.sendButton).first();
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btn.click();
      await this.page.waitForLoadState('domcontentloaded');
      await this.page.waitForTimeout(2000);
    }
  }

  async isInboxVisible(): Promise<boolean> {
    const currentUrl = this.page.url();
    if (currentUrl.includes('messages')) return true;

    const inbox = this.page.getByText('Inbox', { exact: false });
    return await inbox.isVisible({ timeout: 5000 }).catch(() => false);
  }
}
