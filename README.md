# QA Technical Challenge — Red Social (OSSN Demo)

Suite de pruebas funcionales, de accesibilidad y de validación de red para una red social web, ejecutada contra [OSSN Demo](https://demo.opensource-socialnetwork.org).

## Stack Técnico

| Herramienta                 | Propósito                                     |
| --------------------------- | --------------------------------------------- |
| **Playwright** + TypeScript | Framework de automatización E2E               |
| **axe-core**                | Auditoría de accesibilidad WCAG 2.1 AA        |
| **dotenv**                  | Gestión de credenciales via variables de entorno |
| **GitHub Actions**          | Pipeline CI/CD                                |
| **Page Object Model**       | Patrón de diseño para mantenibilidad          |
| **Custom Fixtures**         | `test.extend` para inyección de Page Objects  |
| **storageState**            | Login una vez, reutilizar sesión en toda la suite |

## Setup y Ejecución

```bash
# Instalar dependencias
npm install

# Instalar browsers de Playwright
npx playwright install --with-deps chromium

# (Opcional) Configurar credenciales — ver .env.example
cp .env.example .env

# Ejecutar toda la suite (23 tests)
npx playwright test

# Ver reporte HTML interactivo
npx playwright show-report
```

## Ejecutar por Módulo

```bash
npm run test:auth      # TC-01 a TC-04: Registro y Login
npm run test:social    # TC-05: Publicación con imagen
npm run test:a11y      # Auditoría de accesibilidad (4 páginas)
npm run test:network   # Validación de requests de red + cookies
npm run test:profile   # TC-09: Personalización de perfil
npm run test:messages  # TC-08: Mensajería privada
npm run test:headed    # Ejecutar con browser visible (debugging)
```

## Arquitectura de Proyectos

La suite usa 3 proyectos de Playwright con dependencias explícitas:

```
┌─────────┐
│  setup  │  Login una vez → guarda storageState (cookies + localStorage)
└────┬────┘
     │ depende de
     ▼
┌──────────────┐     ┌─────────────┐
│ authenticated │     │ auth-tests  │  (independiente — prueba login desde cero)
│              │     │             │
│ social/      │     │ register    │
│ a11y/        │     │ login       │
│ network/     │     │ register-   │
│ profile/     │     │  negative   │
│ messaging/   │     └─────────────┘
└──────────────┘
  Usa storageState
  (sesión ya activa)
```

**Beneficio:** El login se ejecuta una sola vez. Los ~13 tests autenticados reutilizan la sesión, eliminando logins repetidos y acelerando la suite.

## Estructura del Proyecto

```
qa-technical-challenge/
├── tests/
│   ├── auth/
│   │   ├── register.spec.ts              # TC-01: Registro exitoso
│   │   ├── register-negative.spec.ts     # TC-02: Registro con datos inválidos
│   │   └── login.spec.ts                 # TC-03/04: Login exitoso e inválido
│   ├── social/
│   │   └── post-image.spec.ts            # TC-05: Publicación con imagen
│   ├── accessibility/
│   │   └── a11y-audit.spec.ts            # Auditoría axe-core (4 páginas, data-driven)
│   ├── api/
│   │   └── network-validation.spec.ts    # Network interception + cookies
│   ├── profile/
│   │   └── edit-profile.spec.ts          # TC-09: Personalizar perfil
│   └── messaging/
│       └── private-messages.spec.ts      # TC-08: Mensajería privada
├── pages/                                 # Page Object Model
│   ├── BasePage.ts                        # Clase base (navegación, esperas, errores)
│   ├── RegisterPage.ts                    # Formulario de registro
│   ├── LoginPage.ts                       # Formulario de login
│   ├── FeedPage.ts                        # Feed principal y publicaciones
│   ├── ProfilePage.ts                     # Edición y visualización de perfil
│   └── MessagesPage.ts                    # Mensajería privada
├── fixtures/
│   ├── auth.setup.ts                      # Setup de autenticación (storageState)
│   ├── page-fixtures.ts                   # Custom fixtures con test.extend
│   ├── test-data.ts                       # Datos de prueba centralizados (DRY)
│   └── test-image.jpg                     # Imagen de prueba para uploads
├── docs/                                  # Plan de Pruebas, Informe, Matriz
├── evidencias/
│   ├── manual/                            # Screenshots de ejecución
│   └── bugs/                              # Videos de bugs encontrados
├── .github/workflows/
│   └── qa-tests.yml                       # Pipeline CI/CD
├── .env.example                           # Plantilla de variables de entorno
├── playwright.config.ts                   # Configuración: 3 proyectos + storageState
└── package.json
```

## Patrones Avanzados de Playwright

### storageState (auth setup)

El archivo `fixtures/auth.setup.ts` hace login una sola vez y persiste la sesión. Los tests autenticados la reutilizan sin repetir el flujo de login:

```typescript
// fixtures/auth.setup.ts
setup('autenticar usuario demo', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="username"]', DEMO_USER.username);
  await page.fill('input[name="password"]', DEMO_USER.password);
  await page.click('input[type="submit"][value="Login"]');
  await expect(page.locator('.topbar')).toBeVisible({ timeout: 15000 });
  await page.context().storageState({ path: AUTH_FILE });
});
```

### Custom Fixtures (`test.extend`)

En lugar de instanciar Page Objects manualmente, se inyectan como fixtures:

```typescript
// Antes (repetitivo)
test('...', async ({ page }) => {
  const loginPage = new LoginPage(page);
  // ...
});

// Después (fixture inyectado)
test('...', async ({ loginPage }) => {
  // loginPage ya está listo para usar
});
```

### Tests Data-Driven (accesibilidad)

Los 4 tests de axe-core se generan dinámicamente desde un array de configuración:

```typescript
const PAGES_TO_AUDIT = [
  { name: 'Registro', path: '/', screenshotName: 'a11y-registro' },
  { name: 'Login', path: '/login', screenshotName: 'a11y-login' },
  // ...
];

for (const pageConfig of PAGES_TO_AUDIT) {
  test(`a11y: ${pageConfig.name}`, async ({ page }) => { /* ... */ });
}
```

### Variables de Entorno

Las credenciales se leen de variables de entorno con fallback seguro:

```typescript
// fixtures/test-data.ts
export const DEMO_USER = {
  username: process.env['DEMO_USERNAME'] ?? 'administrator',
  password: process.env['DEMO_PASSWORD'] ?? 'administrator',
};
```

## Decisiones Técnicas

### ¿Por qué network interception en lugar de API testing directo?
OSSN requiere el componente OssnServices para su API REST, que no está habilitado en la demo pública. En lugar de depender de documentación de API, interceptamos las requests que la UI ya hace al backend, validando la integración real UI<>Backend.

### ¿Por qué `video: 'on'` y no `retain-on-failure`?
Para la entrega del reto, queremos evidencia completa de cada test. En producción se usaría `retain-on-failure` para optimizar storage.

### ¿Por qué ejecución secuencial?
Algunos tests dependen de estado (usuario creado en registro -> login). `fullyParallel: false` garantiza el orden correcto.

### ¿Por qué selectores con múltiples fallbacks?
OSSN no implementa `data-testid`. Los selectores combinan `name` attributes (más estables) con CSS classes (fallback). Los comentarios en cada Page Object explican qué selector es el primario.

### ¿Por qué storageState en vez de login en cada test?
Hacer login en cada test es lento (~5s por login en OSSN demo) y frágil. Con storageState se hace una vez y se reutiliza, ahorrando ~60s en la suite completa y reduciendo puntos de fallo.

### ¿Por qué custom fixtures (`test.extend`)?
Es el patrón recomendado por la documentación oficial de Playwright. Centraliza la creación de Page Objects, elimina boilerplate repetitivo y facilita agregar nuevos POs sin modificar los tests existentes.

## Cobertura de Tests

| ID    | Caso                                        | Tipo         | Ejecución       | Proyecto        |
| ----- | ------------------------------------------- | ------------ | --------------- | --------------- |
| TC-01 | Registro exitoso                            | Happy path   | ✅ Automatizado | auth-tests      |
| TC-02 | Registro datos inválidos (3 escenarios)     | Negativo     | ✅ Automatizado | auth-tests      |
| TC-03 | Login exitoso + network validation          | Happy path   | ✅ Automatizado | auth-tests      |
| TC-04 | Login credenciales inválidas (3 escenarios) | Negativo     | ✅ Automatizado | auth-tests      |
| TC-05 | Publicar imagen con descripción             | Happy path   | ✅ Automatizado | authenticated   |
| TC-06 | Comentar en publicación                     | Happy path   | 📋 Manual       | —               |
| TC-07 | Reaccionar (like) a post                    | Happy + Edge | 📋 Manual       | —               |
| TC-08 | Enviar mensaje privado                      | Happy path   | ✅ Automatizado | authenticated   |
| TC-09 | Personalizar perfil                         | Happy path   | ✅ Automatizado | authenticated   |
| TC-10 | Upload archivo inválido                     | Negativo     | 📋 Manual       | —               |

**7 de 10** casos automatizados + Auditoría de accesibilidad (4 páginas) + Validación de red + Cookies de sesión = **23 tests totales**.

---
**Autora:** Adriana Martínez | Senior QA Engineer & Scrum Master
