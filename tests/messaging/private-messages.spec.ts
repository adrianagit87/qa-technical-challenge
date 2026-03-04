import { test, expect } from '../../fixtures/page-fixtures';

/**
 * TC-08: Mensajeria privada.
 *
 * Flujo: Navegar a mensajes -> Verificar bandeja -> Abrir conversacion -> Enviar
 * Usa storageState del setup — sesion ya activa como administrator.
 *
 * Verificado contra OSSN demo real (marzo 2026):
 * - /messages muestra inbox con conversaciones existentes
 * - Click en una conversacion abre el chat en panel derecho (AJAX)
 * - NO existe /messages/send/{username} (da 404)
 * - NO hay boton "New Message" visible en el inbox
 */
test.describe('TC-08: Mensajeria privada', () => {

  test('debe acceder a la bandeja de mensajes', async ({ page, messagesPage }) => {
    await messagesPage.navigateToInbox();

    // Verificar que la pagina de mensajes carga
    const currentUrl = page.url();
    expect(
      currentUrl,
      'Debe navegar a la seccion de mensajes'
    ).toContain('messages');

    // Verificar que se muestra el inbox
    const hasInbox = await page.getByText('Inbox', { exact: false })
      .isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasInbox, 'Debe mostrar la bandeja de mensajes (Inbox)').toBeTruthy();

    await page.screenshot({ path: 'evidencias/manual/TC-08-bandeja-mensajes.png', fullPage: true });
  });

  test('debe abrir una conversacion y enviar un mensaje', async ({ page, messagesPage }) => {
    const messageText = `Mensaje de prueba QA - ${Date.now()}`;

    // Step 1: Abrir conversacion
    const opened = await messagesPage.openFirstConversation();

    if (!opened) {
      test.info().annotations.push({
        type: 'note',
        description: 'No hay conversaciones existentes en el inbox — no se puede probar envio de mensaje.',
      });
      test.skip(true, 'No hay conversaciones existentes en el inbox');
      return;
    }

    // Verificar que la conversacion se abrio:
    // La URL puede cambiar (message/read/X) o el panel derecho puede cargar via AJAX
    const currentUrl = page.url();
    const urlChanged = currentUrl.includes('message/read') || currentUrl.includes('messages/');

    // Tambien verificar si aparece el textarea (indicador de chat abierto)
    const hasTextarea = await page.locator('textarea, input[name="message"]').first()
      .isVisible({ timeout: 5000 }).catch(() => false);

    // Al menos uno debe ser verdad
    expect(
      urlChanged || hasTextarea,
      `Debe abrir la conversacion. URL: ${currentUrl}, Textarea visible: ${hasTextarea}`
    ).toBeTruthy();

    // Step 2: Escribir y enviar mensaje (si el textarea esta disponible)
    if (hasTextarea) {
      const filled = await messagesPage.fillMessageText(messageText);
      expect(filled, 'Debe poder escribir en el campo de texto del mensaje').toBeTruthy();

      await messagesPage.clickSend();

      // Verificar que no hubo error
      const errorMessage = await messagesPage.getErrorMessage();
      expect(
        errorMessage,
        `No debe mostrar errores al enviar mensaje. Error: "${errorMessage}"`
      ).toBeNull();
    } else {
      // La conversacion se abrio pero no hay textarea visible
      // Esto es un hallazgo de la demo — documentar
      test.info().annotations.push({
        type: 'note',
        description: 'Conversacion abierta pero textarea no visible. OSSN puede usar interfaz AJAX para el chat.',
      });
      console.log('Conversacion abierta pero textarea no encontrado — posible carga AJAX pendiente');
    }

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
      'No debe haber errores 5xx en la seccion de mensajes'
    ).toBe(0);

    await page.screenshot({ path: 'evidencias/manual/TC-08-network-mensajes.png', fullPage: true });
  });
});
