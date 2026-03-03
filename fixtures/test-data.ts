/**
 * Datos de prueba centralizados — Single Source of Truth.
 *
 * REGLA DE ORO: No hardcodear credenciales ni datos fuera de este archivo.
 * Todos los tests importan desde aquí.
 *
 * Las credenciales se leen de variables de entorno (dotenv cargado en
 * playwright.config.ts) con fallback a los valores de la demo publica.
 *
 * Verificado contra OSSN Demo (marzo 2026):
 * - Registro requiere: firstname, lastname, email, email_re, username,
 *   password, birthdate, gender, gdpr_agree
 * - Login requiere: username, password
 */

/**
 * Credenciales del admin de la demo de OSSN.
 * Lee de env vars para soportar CI/CD y entornos distintos.
 */
export const DEMO_USER = {
  username: process.env['DEMO_USERNAME'] ?? 'administrator',
  password: process.env['DEMO_PASSWORD'] ?? 'administrator',
} as const;

/**
 * Genera un email único por ejecución basado en timestamp + random.
 * NO usar como getter — llamar explícitamente en cada test.
 */
export function generateUniqueEmail(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `testqa_${timestamp}_${random}@testmail.com`;
}

/**
 * Genera un username único para evitar colisiones entre ejecuciones.
 */
export function generateUniqueUsername(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `testqa_${timestamp}_${random}`;
}

/**
 * Datos para un registro válido completo.
 * Email y username se generan en cada test — no aquí.
 */
export const validUser = {
  firstName: 'Test',
  lastName: 'QAUser',
  password: 'TestPassword123!',
  gender: 'female' as const,
  birthdate: '01/15/1990',
};

/**
 * Datos para tests negativos de registro.
 */
export const invalidData = {
  weakPassword: 'a',
  invalidEmail: 'not-an-email',
  emptyFields: {
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
  },
};
