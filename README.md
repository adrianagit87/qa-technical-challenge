# QA Technical Challenge — Red Social (OSSN Demo)

Suite de pruebas funcionales, de accesibilidad y de validación de red para una red social web, ejecutada contra [OSSN Demo](https://demo.opensource-socialnetwork.org).

## Stack Técnico

| Herramienta                 | Propósito                                         |
| --------------------------- | ------------------------------------------------- |
| **Playwright** + TypeScript | Framework de automatización E2E                   |
| **axe-core**                | Auditoría de accesibilidad WCAG 2.1 AA            |
| **dotenv**                  | Gestión de credenciales via variables de entorno  |
| **GitHub Actions**          | Pipeline CI/CD                                    |
| **Page Object Model**       | Patrón de diseño para mantenibilidad              |
| **Custom Fixtures**         | `test.extend` para inyección de Page Objects      |
| **storageState**            | Login una vez, reutilizar sesión en toda la suite |

## Setup y Ejecución

```bash
# Instalar dependencias
npm install

# Instalar browsers de Playwright
npx playwright install --with-deps chromium

# (Opcional) Configurar credenciales — ver .env.example
cp .env.example .env

# Ejecutar toda la suite (24 tests)
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

**Beneficio:** El login se ejecuta una sola vez. Los ~14 tests autenticados reutilizan la sesión, eliminando logins repetidos y acelerando la suite.

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
│   │   └── edit-profile.spec.ts          # TC-09: Personalizar perfil (3 tests: edición + restauración + verificación)
│   └── messaging/
│       └── private-messages.spec.ts      # TC-08: Bandeja de mensajes + envío
├── pages/                                 # Page Object Model
│   ├── BasePage.ts                        # Clase base (navegación, esperas, errores, isLoggedIn)
│   ├── RegisterPage.ts                    # Formulario de registro (evaluate para datepicker)
│   ├── LoginPage.ts                       # Formulario de login (waitForSelector)
│   ├── FeedPage.ts                        # Feed principal y publicaciones (getByText)
│   ├── ProfilePage.ts                     # Edición de First Name y perfil público
│   └── MessagesPage.ts                    # Bandeja de mensajes e inbox
├── fixtures/
│   ├── auth.setup.ts                      # Setup de autenticación (storageState)
│   ├── page-fixtures.ts                   # Custom fixtures con test.extend
│   ├── test-data.ts                       # Datos de prueba centralizados (DRY)
│   └── test-image.jpg                     # Imagen de prueba para uploads
├── docs/                                  # Plan de Pruebas, Informe, Reporte de Defectos, Matriz, Checklist
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
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[name="username"]', { timeout: 15000 });

  await page.fill('input[name="username"]', DEMO_USER.username);
  await page.fill('input[name="password"]', DEMO_USER.password);
  await page.click('input[type="submit"][value="Login"]');

  // Esperar redirección a /home — indicador confiable de login exitoso.
  // NO usar .topbar porque OSSN la muestra en TODAS las páginas (incluso sin sesión).
  await page.waitForURL('**/home**', { timeout: 15000 });

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

Los 4 tests de axe-core se generan dinámicamente desde un array de configuración. Las páginas públicas limpian cookies para evitar redirección a `/home`:

```typescript
const PAGES_TO_AUDIT: PageAuditConfig[] = [
  { name: 'Registro', path: '/', screenshotName: 'a11y-registro', needsCleanSession: true },
  { name: 'Login', path: '/login', screenshotName: 'a11y-login', needsCleanSession: true },
  { name: 'Feed', path: '/home', screenshotName: 'a11y-feed', needsCleanSession: false },
  { name: 'Perfil', path: '/u/administrator', screenshotName: 'a11y-perfil', needsCleanSession: false },
];

for (const pageConfig of PAGES_TO_AUDIT) {
  test(`a11y: ${pageConfig.name}`, async ({ page }) => {
    if (pageConfig.needsCleanSession) {
      await page.context().clearCookies();
    }
    // ... auditoría con axe-core
    // Las violaciones critical se documentan como bugs de OSSN (no fallan el test)
  });
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

### ¿Por qué `waitForURL('**/home**')` en lugar de `.topbar`?
OSSN muestra la `.topbar` en TODAS las páginas, incluso sin sesión activa. Esperar la redirección a `/home` es un indicador confiable de que el login fue exitoso. Para verificar si el usuario NO tiene sesión (en tests negativos), se usa `isLoggedIn()` que busca `.ossn-menu-dropdown` — un elemento que solo aparece con sesión autenticada real.

### ¿Por qué `domcontentloaded` en lugar de `networkidle`?
OSSN hace requests de fondo indefinidas (analytics, polling, assets). Esperar `networkidle` causa timeouts frecuentes. Todos los Page Objects usan `domcontentloaded` como estrategia de espera, complementado con `waitForSelector` para elementos específicos, `waitForResponse` para interceptar respuestas del backend, y `waitForLoadState('load')` como fallback.

### ¿Por qué `evaluate()` para el datepicker?
OSSN usa jQuery datepicker que marca el input como `readonly="readonly"`. El método `page.fill()` de Playwright no funciona con inputs readonly. Se usa `evaluate()` para remover el atributo `readonly`, setear el valor directamente en el DOM y disparar el evento `change`.

### ¿Por qué `evaluate()` para abrir conversaciones en mensajería?
Los selectores CSS como `a[href*="message"]` matchean links del sidebar y topbar que están fuera del viewport, no la conversación del inbox. Se usa `evaluate()` para buscar elementos en el content area que tengan timestamps ("X hours ago") y hacer click en ellos directamente.

### ¿Por qué editar First Name y no about/bio?
OSSN no tiene un campo "about" o "bio" visible en la página de edición básica (Basic Settings en `/u/{username}/edit`). Se edita First Name como campo de prueba para demostrar la funcionalidad de personalización de perfil.

### ¿Por qué network interception en lugar de API testing directo?
OSSN requiere el componente OssnServices para su API REST, que no está habilitado en la demo pública. En lugar de depender de documentación de API, interceptamos las requests que la UI ya hace al backend, validando la integración real UI<>Backend.

### ¿Por qué `video: 'on'` y no `retain-on-failure`?
Para la entrega del reto, queremos evidencia completa de cada test. En producción se usaría `retain-on-failure` para optimizar storage.

### ¿Por qué ejecución secuencial?
Algunos tests dependen de estado (usuario creado en registro -> login). `fullyParallel: false` garantiza el orden correcto.

### ¿Por qué selectores con múltiples fallbacks?
OSSN no implementa `data-testid`. Los selectores combinan `name` attributes (más estables) con CSS classes (fallback). Los comentarios en cada Page Object explican qué selector es el primario. El botón de guardado en perfil usa una cadena de fallbacks (`Save`, `Update`, `btn-primary`) y como último recurso `form.submit()` via `evaluate`.

### ¿Por qué storageState en vez de login en cada test?
Hacer login en cada test es lento (~5s por login en OSSN demo) y frágil. Con storageState se hace una vez y se reutiliza, ahorrando ~60s en la suite completa y reduciendo puntos de fallo.

### ¿Por qué custom fixtures (`test.extend`)?
Es el patrón recomendado por la documentación oficial de Playwright. Centraliza la creación de Page Objects, elimina boilerplate repetitivo y facilita agregar nuevos POs sin modificar los tests existentes.

### ¿Por qué los tests de accesibilidad documentan violaciones como bugs y no fallan?
Las violaciones critical de accesibilidad (e.g., `image-alt`, `label`) son defectos de OSSN, no de la suite de pruebas. Fallar el test enmascaría el propósito: auditar la accesibilidad de la app. Se documentan como anotaciones `a11y-bug` en el reporte de Playwright para visibilidad.

### ¿Por qué los tests de network validation limpian cookies?
Los tests de network validation están en el proyecto `authenticated` pero necesitan hacer login manual para interceptar las requests de autenticación. Se limpian las cookies en `beforeEach` para evitar conflictos con el storageState inyectado.

## Cobertura de Tests

| ID    | Caso                                                   | Tipo                 | Ejecución    | Proyecto      |
| ----- | ------------------------------------------------------ | -------------------- | ------------ | ------------- |
| TC-01 | Registro exitoso                                       | Happy path           | Automatizado | auth-tests    |
| TC-02 | Registro datos inválidos (3 escenarios)                | Negativo             | Automatizado | auth-tests    |
| TC-03 | Login exitoso + network validation                     | Happy path           | Automatizado | auth-tests    |
| TC-04 | Login credenciales inválidas (3 escenarios)            | Negativo             | Automatizado | auth-tests    |
| TC-05 | Publicar imagen con descripción                        | Happy path           | Automatizado | authenticated |
| TC-06 | Comentar en publicación                                | Happy path           | Manual       | —             |
| TC-07 | Reaccionar (like) a post                               | Happy + Edge         | Manual       | —             |
| TC-08 | Acceder a bandeja y enviar mensaje                     | Happy path           | Automatizado | authenticated |
| TC-09 | Personalizar perfil (detección de restricción BUG-019) | Happy path + Defecto | Automatizado | authenticated |
| TC-10 | Upload archivo inválido                                | Negativo             | Manual       | —             |

**7 de 10** casos automatizados + Auditoría de accesibilidad (4 páginas) + Validación de red + Cookies de sesión = **24 tests totales**.

## Limitaciones Conocidas

### Cloudflare Turnstile — Protección anti-bot en la demo pública

La demo oficial de OSSN (`demo.opensource-socialnetwork.org`) está protegida por **Cloudflare Turnstile**, un sistema anti-bot que bloquea navegadores automatizados.

**Síntoma:** Al ejecutar los tests, todas las navegaciones son interceptadas por una página de "Performing security verification" con un captcha "Verify you are human" que no puede ser resuelto por automatización.

**Análisis técnico:**
- Cloudflare Turnstile utiliza **TLS fingerprinting (JA3/JA4)** para distinguir browsers automatizados de browsers reales. El Chromium empaquetado de Playwright tiene un fingerprint TLS diferente al de Google Chrome estándar.
- Incluso con `channel: 'chrome'` (Chrome real del sistema) y plugins de stealth (`playwright-extra` + `puppeteer-extra-plugin-stealth`), el **protocolo CDP** (Chrome DevTools Protocol) que Playwright usa para controlar el browser es detectable por Cloudflare.
- El captcha se presenta repetidamente incluso con interacción humana real en modo `--headed`, porque Cloudflare rechaza la sesión a nivel de TLS antes de evaluar la respuesta del captcha.

**Investigación realizada:**
1. ✅ Se intentó cambiar el User-Agent para simular Chrome estándar → Cloudflare no se basa solo en UA.
2. ✅ Se integró `playwright-extra` con `puppeteer-extra-plugin-stealth` → Parcheó APIs JS pero no el TLS.
3. ✅ Se implementó un solver automático de Turnstile con interacción en iframe → Cloudflare rechaza clicks programáticos.
4. ✅ Se usó `channel: 'chrome'` para lanzar Chrome real en vez de Chromium → CDP sigue siendo detectable.
5. ✅ Se intentó bypass manual con headed browser → Cloudflare repite el captcha indefinidamente.

**Conclusión:** Es una limitación de infraestructura externa, no del código de pruebas. Ninguna herramienta de automatización E2E (Playwright, Cypress, Selenium) puede resolver Cloudflare Turnstile de forma confiable cuando está configurado en modo estricto.

**Solución — BASE_URL configurable:**

La suite está diseñada para ser **portable**. Si la demo pública está bloqueada, basta con cambiar `BASE_URL` en el archivo `.env` para apuntar a una instancia OSSN alternativa:

```bash
# .env
BASE_URL=https://otra-instancia-ossn.com
```

Los tests no necesitan ningún cambio — usan rutas relativas (`/login`, `/home`) a través de los Page Objects.

---
**Autora:** Adriana Troche | Senior QA Engineer
