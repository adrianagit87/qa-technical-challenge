import { BasePage } from './BasePage';

/**
 * RegisterPage: Page Object para el formulario de registro de OSSN.
 *
 * El formulario está en la página principal (/).
 * Campos verificados contra la demo real (marzo 2026):
 * - firstname, lastname, email, email_re, username, password
 * - birthdate (datepicker), gender (radio), gdpr_agree (checkbox)
 * - Submit: #ossn-submit-button ("Create an account")
 */
export class RegisterPage extends BasePage {
  // Selectores verificados contra OSSN demo real
  private readonly firstNameInput = 'input[name="firstname"]';
  private readonly lastNameInput = 'input[name="lastname"]';
  private readonly emailInput = 'input[name="email"]';
  private readonly emailConfirmInput = 'input[name="email_re"]';
  private readonly usernameInput = 'input[name="username"]';
  private readonly passwordInput = 'input[name="password"]';
  private readonly birthdateInput = 'input[name="birthdate"]';
  private readonly genderMale = 'input[name="gender"][value="male"]';
  private readonly genderFemale = 'input[name="gender"][value="female"]';
  private readonly gdprCheckbox = 'input[name="gdpr_agree"]';
  private readonly createAccountBtn = '#ossn-submit-button';

  async navigate(): Promise<void> {
    await this.navigateTo('/');
    // NO usar networkidle — OSSN hace requests de fondo indefinidas
    await this.page.waitForSelector(this.firstNameInput, { timeout: 15000 });
  }

  async fillFirstName(name: string): Promise<void> {
    await this.page.fill(this.firstNameInput, name);
  }

  async fillLastName(name: string): Promise<void> {
    await this.page.fill(this.lastNameInput, name);
  }

  async fillEmail(email: string): Promise<void> {
    await this.page.fill(this.emailInput, email);
  }

  async fillEmailConfirmation(email: string): Promise<void> {
    await this.page.fill(this.emailConfirmInput, email);
  }

  async fillUsername(username: string): Promise<void> {
    await this.page.fill(this.usernameInput, username);
  }

  async fillPassword(password: string): Promise<void> {
    await this.page.fill(this.passwordInput, password);
  }

  async fillBirthdate(date: string): Promise<void> {
    // OSSN usa jQuery datepicker que marca el input como readonly="readonly".
    // page.fill() no funciona con inputs readonly — usamos evaluate para
    // setear el valor directamente en el DOM y disparar el evento change.
    await this.page.evaluate(({ selector, value }) => {
      const input = document.querySelector(selector) as HTMLInputElement;
      if (input) {
        input.removeAttribute('readonly');
        input.value = value;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, { selector: this.birthdateInput, value: date });
    // Cerrar el datepicker si aparece
    await this.page.keyboard.press('Escape');
  }

  async selectGender(gender: 'male' | 'female'): Promise<void> {
    const selector = gender === 'male' ? this.genderMale : this.genderFemale;
    await this.page.click(selector);
  }

  async acceptGDPR(): Promise<void> {
    await this.page.check(this.gdprCheckbox);
  }

  async clickCreateAccount(): Promise<void> {
    await this.page.click(this.createAccountBtn);
  }

  /**
   * Registro completo con todos los campos requeridos por OSSN.
   * Genera un username único basado en el email para evitar colisiones.
   */
  async registerUser(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    gender: 'male' | 'female';
    username?: string;
    birthdate?: string;
  }): Promise<string> {
    await this.fillFirstName(data.firstName);
    await this.fillLastName(data.lastName);
    await this.fillEmail(data.email);
    await this.fillEmailConfirmation(data.email);

    const username = data.username || `testqa_${Date.now()}`;
    await this.fillUsername(username);

    await this.fillPassword(data.password);

    // Birthdate es requerido — usar una fecha válida
    const birthdate = data.birthdate || '01/15/1990';
    await this.fillBirthdate(birthdate);

    await this.selectGender(data.gender);
    await this.acceptGDPR();
    await this.clickCreateAccount();

    return data.email;
  }

  async isRegistrationFormVisible(): Promise<boolean> {
    try {
      await this.page.waitForSelector(this.firstNameInput, { timeout: 5000 });
      return true;
    } catch { return false; }
  }
}
