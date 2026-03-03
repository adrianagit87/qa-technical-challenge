import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { FeedPage } from '../pages/FeedPage';
import { ProfilePage } from '../pages/ProfilePage';
import { MessagesPage } from '../pages/MessagesPage';

/**
 * Custom fixtures con test.extend — patrón recomendado por Playwright.
 *
 * Ventajas sobre `new PageObject(page)` en cada test:
 * - Inyección de dependencias: los Page Objects se crean automáticamente.
 * - Consistencia: todos los tests usan los mismos fixtures.
 * - Extensibilidad: agregar un nuevo PO es una línea aquí.
 */
type PageFixtures = {
  loginPage: LoginPage;
  registerPage: RegisterPage;
  feedPage: FeedPage;
  profilePage: ProfilePage;
  messagesPage: MessagesPage;
};

export const test = base.extend<PageFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },
  feedPage: async ({ page }, use) => {
    await use(new FeedPage(page));
  },
  profilePage: async ({ page }, use) => {
    await use(new ProfilePage(page));
  },
  messagesPage: async ({ page }, use) => {
    await use(new MessagesPage(page));
  },
});

export { expect } from '@playwright/test';
