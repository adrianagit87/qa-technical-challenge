# PLAN DE PRUEBAS

## Red Social — Reto Técnico QA Engineer

| Campo | Valor |
|---|---|
| **Aplicación bajo prueba** | Open Source Social Network (OSSN Demo) |
| **Autora** | Adriana Martínez |
| **Rol** | Senior QA Engineer & Scrum Master |
| **Fecha** | Marzo 2026 |
| **Versión** | 2.0 |
| **App target** | demo.opensource-socialnetwork.org |
| **Herramientas** | Playwright + TypeScript, axe-core, dotenv, GitHub Actions |

---

## Tabla de Contenidos

1. Introducción
2. Alcance
3. Estrategia de Pruebas
4. Casos de Prueba
5. Análisis de Riesgos
6. Criterios de Entrada, Salida y Calidad
7. Entorno de Pruebas y Datos
8. Cronograma de Ejecución
9. Recomendaciones para Pruebas Futuras

---

## 1. Introducción

Este plan de pruebas define la estrategia, alcance y enfoque para validar la calidad de una red social web antes de su lanzamiento al mercado. La aplicación permite registro de usuarios, publicación de contenido con imágenes, interacciones sociales y mensajería privada.

Elegí trabajar contra OSSN Demo (Open Source Social Network) porque es la única aplicación de acceso público que cubre las 6 funcionalidades del escenario: registro, login, subida de imágenes, comentarios, reacciones, mensajes privados y personalización de perfil. Otras opciones como Conduit o Mastodon no cubren todas, y automatizar contra Instagram o Facebook sería una mala práctica (captchas, rate limiting, términos de uso).

### 1.1 Objetivo del plan

Garantizar que las funcionalidades críticas de la aplicación sean robustas, seguras y accesibles antes del lanzamiento. Este plan no solo cubre pruebas funcionales — incluye validación de accesibilidad y monitoreo de la comunicación entre frontend y backend.

### 1.2 Audiencia

- **Equipo de desarrollo** — para entender qué se está validando y los criterios de aceptación
- **Product Owner / Manager** — para la decisión de go/no-go de release
- **Otros QAs** — para continuar o expandir la cobertura de pruebas

---

## 2. Alcance

### 2.1 Dentro del alcance

| Módulo | Funcionalidades | Tipos de prueba |
|---|---|---|
| **Autenticación** | Registro de usuario, inicio de sesión, validaciones de campos, manejo de errores | Funcional (happy path + negativo), automatizada, network validation |
| **Publicaciones** | Crear post con imagen y descripción, subida de archivos, validación de formatos | Funcional (happy path + negativo), automatizada |
| **Interacciones sociales** | Comentarios en publicaciones, reacciones (likes), toggle de reacciones | Funcional manual |
| **Mensajería** | Envío y recepción de mensajes privados entre usuarios | Funcional automatizada + network validation |
| **Perfil** | Edición de bio, información personal, persistencia de cambios | Funcional automatizada |
| **Accesibilidad** | Auditoría WCAG 2.1 en páginas clave (registro, login, feed, perfil) | Automatizada con axe-core (data-driven) |
| **Integración UI↔Backend** | Validación de requests HTTP, status codes, payloads en flujos críticos | Automatizada con network interception (Playwright) |

### 2.2 Fuera del alcance

- Pruebas de carga y rendimiento (requieren herramientas como k6 o JMeter y configuración de infraestructura dedicada)
- Pruebas de penetración / seguridad avanzada (requieren expertise especializado y autorización del propietario)
- Testing de la API REST directa (el componente OssnServices no está habilitado en la demo pública)
- Pruebas en dispositivos móviles (el reto se centra en la versión web)
- Pruebas de internacionalización / localización

> **Decisión:** Excluí las pruebas de carga y seguridad avanzada del alcance de ejecución, pero incluyo recomendaciones sobre ambas en la sección de mejoras futuras. No tiene sentido prometer cobertura que no puedo entregar con calidad en 72 horas.

---

## 3. Estrategia de Pruebas

La estrategia se basa en un principio simple: probar primero lo que más daño haría si falla. Registro y login son la puerta de entrada — si no funcionan, nada más importa. Luego las funcionalidades sociales core (publicar, comentar, mensajes), y finalmente los extras que aportan profundidad (accesibilidad, validación de red).

### 3.1 Enfoque por capas

| Capa | Qué valida | Cómo | Herramienta |
|---|---|---|---|
| **UI Funcional** | Que el usuario puede completar los flujos clave | Tests manuales + automatizados | Playwright + ejecución manual en Chrome |
| **Network** | Que la UI se comunica correctamente con el backend | Interceptación de requests HTTP durante tests de UI | Playwright (`page.waitForResponse`, `route`) |
| **Accesibilidad** | Que la app cumple estándares WCAG 2.1 básicos | Auditoría automatizada por página | `@axe-core/playwright` |

### 3.2 Distribución manual vs. automatizada

No automaticé todo, y eso es deliberado. La automatización tiene sentido donde hay repetición, riesgo alto y flujos estables. Los tests manuales cubren interacciones que se benefician de la observación humana.

| Automatizado (7 tests) | Manual (3 tests) |
|---|---|
| TC-01: Registro exitoso | TC-06: Comentar en publicación |
| TC-02: Registro con datos inválidos | TC-07: Reaccionar (like) a post |
| TC-03: Login exitoso | TC-10: Upload de archivo inválido |
| TC-04: Login con credenciales inválidas | |
| TC-05: Publicación con imagen | |
| TC-08: Enviar mensaje privado | |
| TC-09: Personalizar perfil | |
| Flujos de alta frecuencia y riesgo. Se ejecutan en cada build. | Interacciones complejas donde la observación humana detecta issues que un script no capturaría. |

### 3.3 Arquitectura de la suite automatizada

La suite usa patrones avanzados de Playwright que optimizan mantenibilidad y velocidad de ejecución:

| Patrón | Implementación | Beneficio |
|---|---|---|
| **storageState** | `fixtures/auth.setup.ts` hace login una vez y persiste la sesión | Elimina ~12 logins repetidos, ahorra ~60s por ejecución |
| **Custom Fixtures** | `fixtures/page-fixtures.ts` con `test.extend` inyecta Page Objects | Elimina boilerplate `new PageObject(page)` en cada test |
| **Data-driven tests** | `a11y-audit.spec.ts` genera 4 tests desde un array de configuración | Reduce ~80 líneas duplicadas a ~15 de configuración |
| **Variables de entorno** | `dotenv` + `.env.example` para credenciales | Soporte CI/CD sin hardcodear secrets en el código |
| **Proyectos con dependencias** | 3 proyectos: `setup` → `authenticated`, `auth-tests` (independiente) | Tests de auth prueban el flujo completo; el resto reutiliza sesión |

```
┌─────────┐
│  setup  │  Login una vez → guarda storageState
└────┬────┘
     │ depende de
     ▼
┌──────────────┐     ┌─────────────┐
│ authenticated │     │ auth-tests  │  (independiente)
│              │     │             │
│ social/      │     │ register    │
│ a11y/        │     │ login       │
│ network/     │     │ register-   │
│ profile/     │     │  negative   │
│ messaging/   │     └─────────────┘
└──────────────┘
  Usa storageState
```

### 3.4 Herramientas y justificación

| Herramienta | Uso | Por qué esta y no otra |
|---|---|---|
| **Playwright + TypeScript** | Automatización de UI, network interception, video recording | Es mi stack actual. Soporte nativo para múltiples browsers, auto-waits, y video built-in. Elegir Selenium sería retroceder. |
| **axe-core** | Auditoría de accesibilidad WCAG 2.1 | Se integra nativamente con Playwright. Es el estándar de la industria para a11y testing automatizado. |
| **dotenv** | Gestión de credenciales y variables de entorno | Evita hardcodear secrets. Compatible con CI/CD (GitHub Actions secrets). |
| **GitHub Actions** | CI/CD pipeline para ejecutar tests | El código ya vive en GitHub. Es la opción más simple y directa para CI. |
| **Chrome DevTools** | Exploración, análisis de red, performance básico | Disponible sin instalación adicional. Suficiente para el nivel de análisis de este reto. |

---

## 4. Casos de Prueba

10 casos organizados por módulo. Cada caso incluye precondiciones, pasos, resultado esperado y criterio de aceptación. Los detalles completos de ejecución están en el Informe de Pruebas.

### 4.1 Módulo de Autenticación

#### TC-01: Registro exitoso de usuario

| Campo | Valor |
|---|---|
| **Tipo** | Happy path · Automatizado |
| **Proyecto Playwright** | `auth-tests` |
| **Precondición** | Acceder a demo.opensource-socialnetwork.org. No tener sesión activa. |
| **Pasos** | 1. Navegar a la página de registro · 2. Ingresar nombre completo válido · 3. Ingresar email único (generado dinámicamente) · 4. Ingresar password que cumpla política de seguridad · 5. Seleccionar género · 6. Click en "Create an account" |
| **Resultado esperado** | La cuenta se crea exitosamente. El usuario es redirigido al feed o página de bienvenida. El nombre del usuario aparece en la navegación. |
| **Criterio de aceptación** | Redirección exitosa + elemento de sesión activa visible en el DOM. |

#### TC-02: Registro con datos inválidos

| Campo | Valor |
|---|---|
| **Tipo** | Negativo · Automatizado |
| **Proyecto Playwright** | `auth-tests` |
| **Precondición** | Página de registro accesible. |
| **Pasos** | 1. Intentar registro con email ya existente · 2. Intentar registro con password de 1 carácter · 3. Intentar registro con campos obligatorios vacíos · 4. Intentar registro con email de formato inválido (sin @) |
| **Resultado esperado** | En cada caso, la app muestra un mensaje de error claro y no crea la cuenta. El usuario permanece en la página de registro. |
| **Nota** | Este caso es particularmente interesante porque en la exploración inicial de OSSN noté que la validación de password parece débil. Esto podría generar un bug report real. |

#### TC-03: Login exitoso

| Campo | Valor |
|---|---|
| **Tipo** | Happy path · Automatizado + Network validation |
| **Proyecto Playwright** | `auth-tests` |
| **Precondición** | Cuenta de usuario existente y validada. |
| **Pasos** | 1. Navegar a la página de login · 2. Ingresar username y password válidos · 3. Click en "Log in" · 4. [Network] Capturar la request de autenticación |
| **Resultado esperado** | Redirección al feed. Nombre del usuario en la barra de navegación. La request de login retorna status 200/302. |
| **Criterio de aceptación** | UI: elemento de sesión visible. Network: response status exitoso + cookie de sesión establecida. |

#### TC-04: Login con credenciales inválidas

| Campo | Valor |
|---|---|
| **Tipo** | Negativo · Automatizado |
| **Proyecto Playwright** | `auth-tests` |
| **Precondición** | Página de login accesible. |
| **Pasos** | 1. Intentar login con password incorrecto · 2. Intentar login con usuario inexistente · 3. Intentar login con campos vacíos |
| **Resultado esperado** | Mensaje de error visible. No se establece sesión. El usuario permanece en la página de login. El mensaje de error NO revela si el usuario existe (buena práctica de seguridad). |

### 4.2 Módulo Social

#### TC-05: Publicar imagen con descripción

| Campo | Valor |
|---|---|
| **Tipo** | Happy path · Automatizado |
| **Proyecto Playwright** | `authenticated` (usa storageState) |
| **Precondición** | Usuario autenticado con sesión activa. |
| **Pasos** | 1. Navegar al feed o muro del usuario · 2. Adjuntar imagen válida (JPG o PNG, < 5MB) · 3. Escribir descripción/texto del post · 4. Publicar |
| **Resultado esperado** | El post aparece en el feed con la imagen visible y la descripción. El post muestra autor y timestamp. |

### 4.3 Módulo de Mensajería

#### TC-08: Enviar mensaje privado

| Campo | Valor |
|---|---|
| **Tipo** | Happy path · Automatizado + Network validation |
| **Proyecto Playwright** | `authenticated` (usa storageState) |
| **Precondición** | Usuario autenticado con sesión activa. Existe al menos otro usuario en el sistema. |
| **Pasos** | 1. Navegar a la sección de mensajes · 2. Seleccionar destinatario · 3. Escribir mensaje de texto · 4. Enviar mensaje · 5. [Network] Verificar que no hay errores 5xx en requests relacionadas con mensajes |
| **Resultado esperado** | El mensaje se envía correctamente. No se producen errores de servidor. La bandeja de mensajes es accesible y muestra el historial. |
| **Criterio de aceptación** | Navegación exitosa a /messages + envío sin errores 5xx + bandeja de entrada accesible. |

### 4.4 Módulo de Perfil

#### TC-09: Personalizar perfil

| Campo | Valor |
|---|---|
| **Tipo** | Happy path · Automatizado |
| **Proyecto Playwright** | `authenticated` (usa storageState) |
| **Precondición** | Usuario autenticado con sesión activa. |
| **Pasos** | 1. Navegar a la página de edición de perfil · 2. Modificar el campo "About" (bio) con texto único · 3. Guardar cambios · 4. Navegar al perfil público · 5. Verificar que la bio actualizada persiste |
| **Resultado esperado** | Los cambios en la bio persisten después de navegar fuera de la edición. El nombre del usuario es visible en el perfil público. |
| **Criterio de aceptación** | Bio actualizada visible en perfil público + nombre de usuario visible. |

### 4.5 Casos manuales (TC-06, TC-07, TC-10)

| ID | Caso | Tipo | Resultado esperado clave |
|---|---|---|---|
| TC-06 | Comentar en publicación de otro usuario | Happy path | El comentario aparece debajo del post con nombre del autor y timestamp. Otros usuarios pueden ver el comentario. |
| TC-07 | Reaccionar (like) a un post | Happy + Edge | El contador de likes incrementa. Un segundo click hace toggle (unlike). Verificar que la acción es idempotente si se hace click rápidamente. |
| TC-10 | Upload de archivo inválido | Negativo | La app rechaza archivos no soportados (.exe, .txt) y muestra mensaje de error claro. No se publica ningún post. |

---

## 5. Análisis de Riesgos

Este análisis no es un ejercicio teórico — refleja lo que observé durante la exploración inicial de OSSN y lo que conozco por experiencia en apps similares.

| Riesgo identificado | Probabilidad | Impacto | Mitigación / Cómo lo cubro |
|---|---|---|---|
| Validación de password débil o ausente | Alta | Alto | TC-02 valida específicamente políticas de password. Si la app acepta passwords de 1 carácter, se reporta como bug de seguridad. |
| Subida de archivos sin validación de tipo/tamaño | Media | Alto | TC-10 prueba upload de archivos no soportados. Si la app los acepta, es un riesgo de seguridad (potential file injection). |
| XSS en campos de texto (comentarios, bio, mensajes) | Media | Alto | Observación durante pruebas manuales: intentar inputs con `<script>` tags en campos de texto. Si se ejecuta, se reporta como bug crítico. |
| Problemas de accesibilidad en formularios | Alta | Medio | Suite de axe-core audita las páginas con formularios. Los issues critical se reportan como bloqueantes para mercados con regulación de accesibilidad. |
| Mensajes de error que revelan información del sistema | Media | Medio | TC-04 y TC-02 validan que los mensajes de error sean genéricos ("credenciales inválidas" vs. "usuario no existe"). |
| Mensajería privada sin validación de contenido | Media | Medio | TC-08 ahora automatiza el envío de mensajes y valida via network interception que no haya errores de servidor. |

---

## 6. Criterios de Entrada, Salida y Calidad

### 6.1 Criterios de entrada

- La aplicación OSSN demo está disponible y accesible (demo.opensource-socialnetwork.org responde)
- Es posible crear cuentas de usuario nuevas sin restricciones
- El entorno de pruebas tiene datos pre-existentes suficientes (otros usuarios, publicaciones) para pruebas de interacción
- Las herramientas de automatización están configuradas y funcionando localmente

### 6.2 Criterios de salida

- Los 10 casos de prueba han sido ejecutados (7 automatizados + 3 manuales)
- Todos los resultados están documentados con evidencia
- Los bugs encontrados están reportados con severity y priority
- La suite automatizada (23 tests) se ejecuta exitosamente de principio a fin
- La auditoría de accesibilidad ha sido ejecutada en las 4 páginas clave

### 6.3 Criterios de calidad (métricas target)

| Métrica | Target | Criterio de go/no-go |
|---|---|---|
| Pass rate de tests funcionales | >= 80% (8/10 casos pasan) | < 60% = No-Go. Los tests que fallen por bugs de la app se reportan, no se consideran fallo del plan. |
| Bugs críticos abiertos | 0 bugs P1/Critical sin workaround | Cualquier bug crítico sin workaround = No-Go para release. |
| Cobertura de requisitos | 100% de requisitos con al menos 1 caso | Requisito sin cobertura = gap documentado con justificación. |
| Cobertura de automatización | >= 70% de los casos (7/10) | Meta alcanzada. Cada nuevo caso automatizado reduce riesgo de regresión. |
| Violaciones a11y critical | 0 violaciones critical en páginas de auth | Violaciones critical en registro/login = blocker para mercados regulados. |

> **Nota:** Estos targets son los que yo definiría para un release real. En el contexto de este reto, el valor está en demostrar que sé definir métricas medibles, no en que OSSN las cumpla.

---

## 7. Entorno de Pruebas y Datos

### 7.1 Entorno

| Componente | Detalle |
|---|---|
| URL | https://demo.opensource-socialnetwork.org |
| Tipo de entorno | Demo pública (staging simulado) |
| Browser principal | Chromium (Playwright default) |
| SO de ejecución | macOS (local) + Ubuntu (GitHub Actions) |
| Node.js | >= 18.x |

### 7.2 Estrategia de datos de prueba

Los tests automatizados generan sus propios datos en cada ejecución. No dependen de datos pre-existentes en la demo.

- **Emails:** Generados con timestamp (`test_1709234567@example.com`) para evitar duplicados
- **Passwords:** Generados cumpliendo la política de OSSN (lo que descubra durante exploración)
- **Imágenes:** Archivo JPG de prueba incluido en el repositorio (`/fixtures/test-image.jpg`)
- **Usuarios para interacción:** Se usa el usuario administrador de la demo (`administrator`), cuyas credenciales se leen de variables de entorno con fallback a los valores públicos
- **Credenciales:** Gestionadas via `.env` (gitignored) con plantilla en `.env.example`. En CI/CD se inyectan como secrets de GitHub Actions.

> **Por qué no uso datos hardcoded:** En una demo pública, otros usuarios pueden estar registrando las mismas cuentas. Generar datos dinámicos garantiza que mis tests son independientes de lo que haga cualquier otra persona en el entorno.

### 7.3 Gestión de sesiones (storageState)

Para optimizar la ejecución, la suite usa el patrón **storageState** de Playwright:

1. Un proyecto `setup` hace login una sola vez y guarda cookies + localStorage en `test-results/.auth/user.json`
2. Los tests autenticados (social, a11y, network, profile, messaging) reutilizan esa sesión
3. Los tests de autenticación (register, login) **no** usan storageState — prueban el flujo completo desde cero

Esto reduce el tiempo de ejecución en ~60 segundos y elimina puntos de fallo redundantes.

---

## 8. Cronograma de Ejecución

| Fase | Actividad | Duración estimada |
|---|---|---|
| Día 1 | Exploración de OSSN + diseño de 10 casos + ejecución manual de 5 casos con evidencias + captura de bugs | 12-14 horas |
| Día 2 | Automatización de 5 tests core + suite de accesibilidad + network interception + setup CI/CD | 14-15 horas |
| Día 3 | Mejoras de calidad (DRY, storageState, fixtures, data-driven) + automatización TC-08/TC-09 + documentación + empaquetado | 12-14 horas |

---

## 9. Recomendaciones para Pruebas Futuras

Si este fuera un proyecto real y no un reto técnico, las siguientes acciones serían mi prioridad inmediata:

### 9.1 Ampliar cobertura de automatización

- Automatizar TC-06, TC-07 y TC-10 (los 3 casos manuales restantes) una vez que los selectores de OSSN se estabilicen
- Agregar tests de regresión visual con Playwright screenshot comparison
- Implementar tests de API directos una vez habilitado el componente OssnServices
- Agregar casos negativos para mensajería (TC-08): mensaje vacío, mensaje con adjunto, conversación con usuario bloqueado
- Agregar casos negativos para perfil (TC-09): upload de avatar con formato inválido, bio con longitud máxima

### 9.2 Pruebas de rendimiento

- Usar k6 o Artillery para medir tiempos de respuesta de login y carga de feed bajo concurrencia
- Definir SLOs: login < 2s, carga de feed < 3s, upload de imagen < 5s
- Integrar métricas de rendimiento en el pipeline de CI

### 9.3 Seguridad

- Auditoría de headers de seguridad (CSP, X-Frame-Options, HSTS)
- Testing de CSRF en formularios (verificar presencia de tokens)
- Validación de sanitización de inputs en todos los campos de texto (XSS prevention)
- Revisión de cookies (flags Secure, HttpOnly, SameSite)

### 9.4 Accesibilidad continua

- Integrar axe-core como quality gate en el pipeline: 0 violaciones critical = requerido para merge
- Testing manual con lector de pantalla (VoiceOver en Mac, NVDA en Windows)
- Validar navegación completa por teclado en todos los flujos

> Estas recomendaciones no son genéricas. Cada una responde a algo que observé o que quedó fuera del alcance de este reto por tiempo. En un contexto real, las priorizaría en función del roadmap de producto y los mercados target.

---

> Este plan es un documento vivo. En un equipo real, lo revisaría con development y product antes de ejecutar, ajustando alcance y prioridades según su input. La calidad no es responsabilidad exclusiva de QA — es una decisión de equipo.
