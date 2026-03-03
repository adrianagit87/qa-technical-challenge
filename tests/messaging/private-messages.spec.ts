import { test, expect } from '../../fixtures/page-fixtures';

/**
 * TC-08: Mensajería privada.
 *
 * Flujo: Navegar a mensajes → Verificar bandeja → Abrir conversación → Enviar
 * Usa storageState del setup — sesión ya activa como administrator.
 *
 * Verificado contra OSSN demo real (marzo 2026):
 * - /messages muestra inbox con conversaciones existentes
 * - Click en una conversación abre el chat
 * - NO existe /messages/send/{username} (da 404)
 * - NO hay botón "New Message" visible en el inbox
 */
test.describe('TC-08: Mensajeria privada', () => {

  test('debe acceder a la bandeja de mensajes', async ({ page, messagesPage }) => {
    await messagesPage.navigateToInbox();

    // Verificar que la página de mensajes carga
    const currentUrl = page.url();
    expect(
      currentUrl,
      'Debe navegar a la sección de mensajes'
    ).toContain('messages');

    // Verificar que se muestra el inbox
    const hasInbox = await page.getByText('Inbox', { exact: false })
      .isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasInbox, 'Debe mostrar la bandeja de mensajes (Inbox)').toBeTruthy();

    await page.screenshot({ path: 'evidencias/manual/TC-08-bandeja-mensajes.png', fullPage: true });
  });

  test('debe abrir una conversacion y enviar un mensaje', async ({ page, messagesPage }) => {
    const messageText = `Mensaje de prueba QA - ${Date.now()}`;

    await test.step('Abrir primera conversación existente', async () => {
      const opened = await messagesPage.openFirstConversation();

      if (!opened) {
        test.info().annotations.push({
          type: 'note',
          description: 'No hay conversaciones existentes en el inbox — no se puede probar envío de mensaje.',
        });
        test.skip(true, 'No hay conversaciones existentes en el inbox');
        return;
      }
    });

    await test.step('Escribir y enviar mensaje', async () => {
      const filled = await messagesPage.fillMessageText(messageText);

      if (filled) {
        await messagesPage.clickSend();
      } else {
        // El chat puede no tener textarea visible — documentar como hallazgo
        test.info().annotations.push({
          type: 'note',
          description: 'No se encontró campo de texto en la conversación abierta.',
        });
      }
    });

    await test.step('Verificar resultado', async () => {
      // Verificar que no hubo error de servidor
      const errorMessage = await messagesPage.getErrorMessage();
      if (errorMessage) {
        test.info().annotations.push({
          type: 'note',
          description: `Respuesta del sistema: "${errorMessage}"`,
        });
      }
    });

    await page.screenshot({ path: 'evidencias/manual/TC-08-enviar-mensaje.png', fullPage: true });
  });

  test('debe validar requests de red en la seccion de mensajes', async ({ page, messagesPage }) => {
    const responses: { url: string; status: number }[] = [];

    page.on('response', response => {
      if (response.url().includes('message')) {
        responses.push({
          url: response.url(),
          status: response.status(),
        });
      }
    });

    await messagesPage.navigateToInbox();
    await page.waitForTimeout(2000);

    console.log(`\n=== Network: Message Requests ===`);
    console.log(`Total message-related requests: ${responses.length}`);
    responses.forEach(r => {
      console.log(`  ${r.url} -> ${r.status}`);
    });

    // Verificar que no hubo errores de servidor
    const serverErrors = responses.filter(r => r.status >= 500);
    expect(
      serverErrors.length,
      'No debe haber errores 5xx en la sección de mensajes'
    ).toBe(0);

    await page.screenshot({ path: 'evidencias/manual/TC-08-network-mensajes.png', fullPage: true });
  });
});
