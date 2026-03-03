import { BasePage } from './BasePage';

/**
 * LoginPage: Page Object para el formulario de login de OSSN.
 *
 * URL: /login
 * Campos verificados contra la demo real (marzo 2026):
 * - username (input[name="username"])
 * - password (input[name="password"])
 * - Submit: input[type="submit"][value="Login"]
 *
 * Form action: /action/user/login (POST)
 */
export class LoginPage extends BasePage {
  private readonly usernameInput = 'input[name="username"]';
  private readonly passwordInput = 'input[name="password"]';
  private readonly loginButton = 'input[type="submit"][value="Login"]';

  async navigate(): Promise<void> {
    await this.navigateTo('/login');
    // Esperar a que el formulario de login sea visible (no networkidle — OSSN hace requests de fondo)
    await this.page.waitForSelector(this.usernameInput, { timeout: 15000 });
  }

  async fillUsername(username: string): Promise<void> {
    await this.page.fill(this.usernameInput, username);
  }

  async fillPassword(password: string): Promise<void> {
    await this.page.fill(this.passwordInput, password);
  }

  async clickLogin(): Promise<void> {
    await this.page.click(this.loginButton);
  }

  /**
   * Login completo. Llena campos y envía.
   */
  async login(username: string, password: string): Promise<void> {
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.clickLogin();
  }

  async isLoginFormVisible(): Promise<boolean> {
    try {
      await this.page.waitForSelector(this.usernameInput, { timeout: 5000 });
      return true;
    } catch { return false; }
  }
}
