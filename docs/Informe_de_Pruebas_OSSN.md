# INFORME DE PRUEBAS

## Red Social — Reto Técnico QA Engineer

| Campo | Valor |
|---|---|
| **Aplicación bajo prueba** | Open Source Social Network (OSSN Demo) |
| **URL** | https://demo.opensource-socialnetwork.org |
| **Autora** | Adriana Martínez |
| **Rol** | Senior QA Engineer & Scrum Master |
| **Fecha de ejecución** | 3–4 de Marzo, 2026 |
| **Versión del informe** | 2.0 |
| **Herramientas** | Playwright 1.50+, TypeScript, axe-core, GitHub Actions |
| **Browser** | Chromium (Playwright default) |
| **SO** | macOS (local) + Ubuntu (CI/CD) |

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Alcance de las Pruebas Ejecutadas](#2-alcance-de-las-pruebas-ejecutadas)
3. [Resultados de Pruebas Funcionales](#3-resultados-de-pruebas-funcionales)
4. [Resultados de Pruebas No Funcionales](#4-resultados-de-pruebas-no-funcionales)
5. [Reporte de Defectos](#5-reporte-de-defectos)
6. [Métricas](#6-métricas)
7. [Conclusiones por Tipo de Prueba](#7-conclusiones-por-tipo-de-prueba)
8. [Notas de Mejora para Pruebas Futuras](#8-notas-de-mejora-para-pruebas-futuras)
9. [Evidencias](#9-evidencias)

---

## 1. Resumen Ejecutivo

Se ejecutaron **10 casos de prueba** que cubren los 6 requisitos funcionales de la aplicación: registro, login, publicación con imagen, comentarios, reacciones, mensajería privada y personalización de perfil.

De los 10 casos, **7 fueron automatizados** (23 tests en Playwright) y **3 fueron ejecutados manualmente**. Adicionalmente se ejecutaron pruebas no funcionales de accesibilidad (WCAG 2.1 AA) y validación de red (HTTP requests/responses).

### Resultado general

| Indicador | Valor |
|-----------|-------|
| Casos de prueba diseñados | 10 |
| Casos ejecutados | 10 (100%) |
| Casos automatizados | 7 (70%) |
| Casos manuales | 3 (30%) |
| Tests automatizados (Playwright) | 23/23 passing |
| Requisitos cubiertos | 6/6 (100%) |
| Defectos encontrados | **18** (0 Críticos, 8 Altos, 8 Medios, 2 Bajos) |
| Decisión recomendada | **Go condicional** — Sin defectos críticos. Los 8 defectos de severidad alta (cookies + accesibilidad) deben priorizarse en sprints siguientes |

---

## 2. Alcance de las Pruebas Ejecutadas

### 2.1 Pruebas funcionales

| ID | Caso de prueba | Tipo | Ejecución | Requisito | Resultado |
|----|----------------|------|-----------|-----------|-----------|
| TC-01 | Registro exitoso | Happy path | Automatizado | REQ-01 | **PASSED** |
| TC-02 | Registro con datos inválidos | Negativo | Automatizado | REQ-01 | **PASSED** |
| TC-03 | Login exitoso | Happy path | Automatizado | REQ-02 | **PASSED** |
| TC-04 | Login con credenciales inválidas | Negativo | Automatizado | REQ-02 | **PASSED** |
| TC-05 | Publicar imagen con descripción | Happy path | Automatizado | REQ-03 | **PASSED** |
| TC-06 | Comentar en publicación | Happy path | Manual | REQ-04 | **PASSED** |
| TC-07 | Reaccionar (like/unlike) a post | Happy + Edge | Manual | REQ-04 | **PASSED** |
| TC-08 | Enviar mensaje privado | Happy path | Automatizado | REQ-05 | **PASSED** |
| TC-09 | Personalizar perfil | Happy path | Automatizado | REQ-06 | **PASSED** |
| TC-10 | Upload de archivo inválido | Negativo | Manual | REQ-03 | **PASSED** (con hallazgo) |

### 2.2 Pruebas no funcionales

| Tipo | Herramienta | Páginas evaluadas | Resultado |
|------|-------------|-------------------|-----------|
| Accesibilidad (WCAG 2.1 AA) | axe-core + Playwright | 4 (Registro, Login, Feed, Perfil) | **14 violaciones** documentadas |
| Validación de red (HTTP) | Playwright network interception | 3 flujos (Login, Páginas públicas, Cookies) | **3 hallazgos** en cookies de seguridad |

---

## 3. Resultados de Pruebas Funcionales

### 3.1 Pruebas Automatizadas

#### TC-01: Registro exitoso de usuario

| Campo | Detalle |
|-------|---------|
| **Precondición** | Página de registro accesible. Sin sesión activa. |
| **Pasos ejecutados** | 1. Navegar a `/` · 2. Completar formulario con datos válidos (email y username generados dinámicamente) · 3. Setear fecha de nacimiento via `evaluate()` (bypass datepicker readonly) · 4. Aceptar GDPR · 5. Click "Create an account" |
| **Resultado esperado** | Cuenta creada sin errores de validación. |
| **Resultado obtenido** | **PASSED** — Formulario enviado sin errores. No se muestran mensajes de error. |
| **Notas técnicas** | Se usa `domcontentloaded` + `waitForTimeout` porque OSSN hace requests indefinidas que bloquean `networkidle`. El campo birthdate requiere `evaluate()` para remover el atributo `readonly` del datepicker jQuery. En la demo pública, OSSN puede no redirigir a /home tras registro. |
| **Evidencia** | `evidencias/manual/TC-01-registro-exitoso.png` |

#### TC-02: Registro con datos inválidos (3 sub-tests)

| Campo | Detalle |
|-------|---------|
| **Precondición** | Página de registro accesible. |
| **Sub-test 1** | Password débil (1 carácter "a"): OSSN **rechaza correctamente** el registro y muestra el mensaje "The password must be more than 5 characters". **PASSED** — validación funciona. |
| **Sub-test 2** | Campos vacíos: OSSN permanece en la página de registro sin crear la cuenta. **PASSED** — validación funciona. |
| **Sub-test 3** | Email inválido ("not-an-email"): OSSN **rechaza correctamente** el email sin formato válido y permanece en la página de registro. **PASSED** — validación funciona. |
| **Resultado obtenido** | **PASSED** — Los 3 sub-tests confirman que la validación del formulario de registro funciona correctamente para los escenarios probados. |
| **Evidencia** | `evidencias/manual/TC-02-campos-vacios.png`, `evidencias/manual/TC-02-password-debil.png`, `evidencias/manual/TC-02-email-invalido.png` |

#### TC-03: Login exitoso

| Campo | Detalle |
|-------|---------|
| **Precondición** | Cuenta de usuario existente (administrator). |
| **Pasos ejecutados** | 1. Navegar a `/login` · 2. Ingresar credenciales válidas · 3. Click "Login" · 4. Capturar request de autenticación via network interception |
| **Resultado esperado** | Redirección a `/home`. Response status < 400. |
| **Resultado obtenido** | **PASSED** — Redirección exitosa a `/home`. Request de login capturada con status válido (302 redirect). |
| **Notas técnicas** | NO se usa `.topbar` como indicador de sesión porque OSSN la muestra en todas las páginas, incluso sin sesión. Se usa `waitForURL('**/home**')` como indicador confiable. |
| **Evidencia** | `evidencias/manual/TC-03-login-exitoso.png`, `evidencias/manual/TC-03-login-network.png` |

#### TC-04: Login con credenciales inválidas (3 sub-tests)

| Campo | Detalle |
|-------|---------|
| **Sub-test 1** | Password incorrecto: OSSN rechaza el login. No se establece sesión (`isLoggedIn()` retorna false). **PASSED**. |
| **Sub-test 2** | Usuario inexistente: OSSN rechaza el login. No se establece sesión. **PASSED**. |
| **Sub-test 3** | Campos vacíos: OSSN no crea sesión con campos vacíos. **PASSED**. |
| **Verificación** | `loginPage.isLoggedIn()` usa `.ossn-menu-dropdown` — elemento que solo aparece con sesión autenticada real. |
| **Observación de seguridad** | Se verificó que los mensajes de error no revelan si el usuario existe. El test no encontró enumeración de usuarios. |
| **Evidencia** | `evidencias/manual/TC-04-password-incorrecto.png`, `evidencias/manual/TC-04-usuario-inexistente.png`, `evidencias/manual/TC-04-campos-vacios.png` |

#### TC-05: Publicar imagen con descripción

| Campo | Detalle |
|-------|---------|
| **Precondición** | Sesión activa via storageState. |
| **Pasos ejecutados** | 1. Navegar a `/home` · 2. Escribir texto en "What's on your mind?" · 3. Adjuntar imagen JPG via `setInputFiles` · 4. Click "Post" · 5. Verificar texto visible · 6. Verificar imagen visible |
| **Resultado esperado** | Post visible en el feed con texto e imagen. |
| **Resultado obtenido** | **PASSED** — Tanto el texto como la imagen son visibles en el feed después de publicar. |
| **Evidencia** | `evidencias/manual/TC-05-post-imagen.png` |

#### TC-08: Enviar mensaje privado (3 sub-tests)

| Campo | Detalle |
|-------|---------|
| **Sub-test 1** | Acceso a bandeja de mensajes: Navegación a `/messages` exitosa. Inbox visible con conversaciones. **PASSED**. |
| **Sub-test 2** | Abrir conversación y enviar mensaje: Se extrae la URL de la conversación del atributo `onclick="Ossn.redirect('messages/message/{username}')"` y se navega directamente. Se escribe y envía mensaje. Sin errores. **PASSED**. |
| **Sub-test 3** | Validación de red: No se detectan errores 5xx en requests relacionadas con mensajes. **PASSED**. |
| **Notas técnicas** | Los items del inbox usan `div.ossn-recent-message-item[onclick]` — NO son `<a>` tags. Se extrae el path del atributo onclick y se navega con `page.goto()`. NO existe `/messages/send/{username}` en OSSN. |
| **Evidencia** | `evidencias/manual/TC-08-bandeja-mensajes.png`, `evidencias/manual/TC-08-enviar-mensaje.png`, `evidencias/manual/TC-08-network-mensajes.png` |

#### TC-09: Personalizar perfil (2 sub-tests)

| Campo | Detalle |
|-------|---------|
| **Sub-test 1** | Editar perfil y verificar persistencia: Navegación a `/u/administrator/edit`, edición de First Name en "Basic Settings", guardado, navegación al perfil público, verificación de que el nombre editado aparece correctamente. **PASSED**. |
| **Sub-test 2** | Verificar nombre en perfil: Navegación a `/u/administrator`, nombre visible y legible (no vacío). **PASSED**. |
| **Notas técnicas** | OSSN NO tiene campo about/bio en la página de edición básica. Se edita First Name como campo de prueba. Se verifica persistencia navegando al perfil público y comprobando que `getProfileName()` contiene el nombre editado. |
| **Evidencia** | `evidencias/manual/TC-09-editar-perfil.png`, `evidencias/manual/TC-09-perfil-nombre.png` |

---

### 3.2 Pruebas Manuales

#### TC-06: Comentar en publicación

| Campo | Detalle |
|-------|---------|
| **Precondición** | Sesión activa como `administrator`. Feed visible con posts de otros usuarios. |
| **Paso 1** | Navegar al feed (`/home`) y localizar el post "Welcome to OSSN demo, feel free to play around!" de System Administrator. |
| **Paso 2** | Click en el campo "Write a comment..." debajo del post. Escribir: `Comentario de prueba QA - TC-06`. |
| **Paso 3** | Presionar Enter para enviar el comentario. |
| **Paso 4** | Verificar que el comentario aparece debajo del post. |
| **Resultado esperado** | El comentario se publica y es visible con el nombre del autor y timestamp. |
| **Resultado obtenido** | **PASSED** — El comentario "Comentario de prueba QA - TC-06" aparece correctamente con "System Administrator" como autor y "0 seconds ago" como timestamp. |
| **Observaciones** | El campo de comentario permite texto, GIFs, emojis e imágenes. No se detectaron errores. La interfaz es responsive e intuitiva. |
| **Evidencia** | Screenshot: campo de comentario con texto escrito + comentario publicado con autor y timestamp. |

#### TC-07: Reaccionar (like/unlike) a un post

| Campo | Detalle |
|-------|---------|
| **Precondición** | Sesión activa como `administrator`. Post visible en el feed. |
| **Paso 1** | Localizar un post con indicador de reacciones: "4 People reacted on this". El botón muestra "Like". |
| **Paso 2** | Click en "Like". |
| **Paso 3** | Verificar que el botón cambia a "Unlike" y el contador actualiza a "You and 4 People reacted on this". |
| **Paso 4** | Click en "Unlike" (segundo click — toggle). |
| **Paso 5** | Verificar que el botón vuelve a "Like" y el contador regresa a "4 People reacted on this". |
| **Resultado esperado** | El like se registra (toggle on) y un segundo click lo quita (toggle off). El contador se actualiza en tiempo real. |
| **Resultado obtenido** | **PASSED** — El toggle funciona correctamente en ambas direcciones. El contador se actualiza inmediatamente sin necesidad de recargar la página. |
| **Observaciones** | OSSN soporta múltiples tipos de reacciones (no solo like). El toggle es instantáneo (AJAX). No se detectaron problemas de doble-click o race conditions. |
| **Evidencia** | Screenshots: estado "liked" (Unlike + "You and 4 People") y estado "unliked" (Like + "4 People"). |

#### TC-10: Upload de archivo inválido

| Campo | Detalle |
|-------|---------|
| **Precondición** | Sesión activa como `administrator`. Feed visible con formulario de post. |
| **Paso 1** | En el feed, click en el icono de cámara (adjuntar archivo) en el formulario de post. |
| **Paso 2** | Seleccionar un archivo `.xlsx` (hoja de cálculo). |
| **Paso 3** | Observar la respuesta de la aplicación. |
| **Paso 4** | Repetir con un archivo `.txt`. |
| **Resultado esperado** | La aplicación rechaza archivos no soportados con un mensaje claro indicando los formatos permitidos. |
| **Resultado obtenido** | **PASSED con hallazgo** — La app rechaza ambos archivos (.xlsx y .txt), pero el mensaje de error es genérico: **"Something went wrong! Cannot save the uploaded file."** No indica al usuario que el tipo de archivo no es soportado ni cuáles son los formatos válidos. |
| **Defecto encontrado** | **BUG-018 (Medio)** — El mensaje de error no es informativo. Debería indicar los formatos válidos. |
| **Evidencia** | Screenshot: modal de error "Something went wrong! Cannot save the uploaded file." |

---

## 4. Resultados de Pruebas No Funcionales

### 4.1 Accesibilidad — Auditoría WCAG 2.1 AA

Se ejecutó `@axe-core/playwright` en 4 páginas clave de la aplicación. Los resultados revelan **deficiencias significativas** en el cumplimiento de WCAG 2.1 nivel AA.

| Página | Violaciones Critical/Serious | Elementos afectados | Principales problemas |
|--------|------------------------------|--------------------|-----------------------|
| **Registro** | 2 | 6 | `image-alt` (1), `label` (3), `color-contrast` (2) |
| **Login** | 2 | 3 | `label` (2), `color-contrast` (1) |
| **Feed** | 5 | 100+ | `image-alt` (33), `aria-command-name` (12), `color-contrast` (16), `link-name` (3), `list` (36) |
| **Perfil** | 4 | 68+ | `image-alt` (35), `aria-command-name` (12), `color-contrast` (17), `link-name` (4) |

**Hallazgo principal:** La violación más grave es `image-alt` — **más de 68 imágenes** en la aplicación carecen de texto alternativo. Esto hace la aplicación inutilizable para usuarios con lectores de pantalla. Los formularios de registro y login tampoco tienen labels asociados a sus campos, lo que afecta tanto la accesibilidad como la usabilidad en dispositivos asistivos.

### 4.2 Validación de Red (Network Interception)

Se interceptaron requests HTTP durante flujos críticos para validar la comunicación UI↔Backend.

#### Flujo de Login

| Aspecto validado | Resultado |
|-----------------|-----------|
| Request de login enviada correctamente | **OK** — POST a `/action/user/login` |
| Response status < 400 | **OK** — 302 Redirect |
| No hay errores 5xx | **OK** |

#### Páginas Públicas

| Aspecto validado | Resultado |
|-----------------|-----------|
| Registro (`/`) responde sin errores | **OK** |
| Login (`/login`) responde sin errores | **OK** |
| No hay errores 5xx en páginas sin autenticación | **OK** |

#### Cookies de Sesión

| Aspecto validado | Resultado | Hallazgo |
|-----------------|-----------|----------|
| Se establece cookie de sesión (`PHPSESSID`) | **OK** | |
| Flag `HttpOnly` en cookies sensibles | **FAIL** | `ossn_chat_bell` no tiene `HttpOnly` → **BUG-001** |
| Flag `Secure` en cookies sensibles | **FAIL** | `PHPSESSID` y `ossn_chat_bell` sin `Secure` → **BUG-002, BUG-003** |

---

## 5. Reporte de Defectos

Se identificaron **18 defectos** durante la ejecución de pruebas funcionales, de seguridad y accesibilidad.

### 5.1 Resumen por severidad

| Severidad | Cantidad | Porcentaje |
|-----------|----------|------------|
| Crítica | 0 | 0% |
| Alta | 8 | 44% |
| Media | 8 | 44% |
| Baja | 2 | 12% |
| **Total** | **18** | **100%** |

### 5.2 Resumen por categoría

| Categoría | Cantidad | Severidad predominante |
|-----------|----------|----------------------|
| Seguridad (Cookies) | 3 | 3 Altos |
| Accesibilidad (WCAG 2.1) | 14 | 5 Altos + 7 Medios + 2 Bajos |
| UX / Validación | 1 | 1 Medio |
| **Total** | **18** | |

### 5.3 Detalle de Defectos — Seguridad (Cookies)

#### BUG-001 — Cookie `ossn_chat_bell` sin flag HttpOnly

| Campo | Detalle |
|-------|---------|
| **ID** | BUG-001 |
| **Severidad** | **ALTA** |
| **Prioridad** | P2 |
| **Módulo** | Seguridad / Cookies |
| **Encontrado en** | Network validation (cookies) |
| **Descripción** | La cookie `ossn_chat_bell` no tiene el flag `HttpOnly`, lo que permite que scripts del lado del cliente (JavaScript) la lean. En caso de una vulnerabilidad XSS, un atacante podría exfiltrar esta cookie. |
| **Remediación** | Agregar flag `HttpOnly` a todas las cookies que no necesiten ser accedidas por JavaScript. |

#### BUG-002 — Cookie `PHPSESSID` sin flag Secure

| Campo | Detalle |
|-------|---------|
| **ID** | BUG-002 |
| **Severidad** | **ALTA** |
| **Prioridad** | P2 |
| **Módulo** | Seguridad / Cookies |
| **Encontrado en** | Network validation (cookies) |
| **Descripción** | La cookie de sesión `PHPSESSID` no tiene el flag `Secure`, lo que significa que se transmite en conexiones HTTP no cifradas. Vulnerable a ataques Man-in-the-Middle (MITM). |
| **Remediación** | Configurar `session.cookie_secure = 1` en PHP y forzar HTTPS. |

#### BUG-003 — Cookie `ossn_chat_bell` sin flag Secure

| Campo | Detalle |
|-------|---------|
| **ID** | BUG-003 |
| **Severidad** | **ALTA** |
| **Prioridad** | P2 |
| **Módulo** | Seguridad / Cookies |
| **Encontrado en** | Network validation (cookies) |
| **Descripción** | La cookie `ossn_chat_bell` no tiene el flag `Secure`. Misma vulnerabilidad que BUG-002. |

### 5.4 Detalle de Defectos — Accesibilidad (WCAG 2.1 AA)

#### BUG-004 a BUG-017 — Violaciones de accesibilidad

| ID | Regla WCAG | Página | Elementos | Severidad | Descripción |
|----|-----------|--------|-----------|-----------|-------------|
| BUG-004 | `image-alt` | Registro | 1 | **Alta** | Imagen sin texto alternativo. Los lectores de pantalla no pueden describir la imagen. |
| BUG-005 | `label` | Registro | 3 | **Alta** | Campos de formulario sin label `<label>` asociado. Usuarios con lectores de pantalla no saben qué ingresar en cada campo. |
| BUG-006 | `color-contrast` | Registro | 2 | **Media** | Ratio de contraste insuficiente (< 4.5:1). Texto difícil de leer para usuarios con baja visión. |
| BUG-007 | `label` | Login | 2 | **Alta** | Campos username y password sin labels asociados. |
| BUG-008 | `color-contrast` | Login | 1 | **Media** | Contraste insuficiente en texto de la página de login. |
| BUG-009 | `image-alt` | Feed | 33 | **Alta** | 33 imágenes sin alt text en el feed principal. Incluye avatares, fotos de posts e iconos. |
| BUG-010 | `aria-command-name` | Feed | 12 | **Media** | Botones con roles ARIA que no tienen nombre accesible. |
| BUG-011 | `color-contrast` | Feed | 16 | **Media** | 16 elementos con contraste insuficiente en el feed. |
| BUG-012 | `link-name` | Feed | 3 | **Media** | Links sin texto descriptivo (solo imágenes o vacíos). |
| BUG-013 | `list/listitem` | Feed | 36 | **Baja** | Elementos `<li>` fuera de `<ul>` o `<ol>`. Estructura semántica incorrecta. |
| BUG-014 | `image-alt` | Perfil | 35 | **Alta** | 35 imágenes sin alt text en la página de perfil. |
| BUG-015 | `aria-command-name` | Perfil | 12 | **Media** | Botones ARIA sin nombre accesible en el perfil. |
| BUG-016 | `color-contrast` | Perfil | 17 | **Media** | 17 elementos con contraste insuficiente en el perfil. |
| BUG-017 | `link-name` | Perfil | 4 | **Baja** | Links sin texto descriptivo en el perfil. |

**Total de elementos DOM afectados:** ~236

### 5.5 Detalle de Defectos — UX / Validación

#### BUG-018 — Mensaje de error genérico al subir archivo inválido

| Campo | Detalle |
|-------|---------|
| **ID** | BUG-018 |
| **Severidad** | **MEDIA** |
| **Prioridad** | P3 |
| **Módulo** | Publicaciones / Upload |
| **Encontrado en** | TC-10 (upload de archivo inválido — manual) |
| **Descripción** | Al intentar subir un archivo no soportado (.xlsx, .txt), la aplicación muestra el mensaje genérico: "Something went wrong! Cannot save the uploaded file." No indica al usuario que el tipo de archivo no es soportado ni cuáles son los formatos válidos. |
| **Resultado esperado** | Mensaje claro como: "Only image files (JPG, PNG, GIF) are allowed." La validación debería ocurrir en el cliente antes de intentar el upload. |
| **Impacto** | UX deficiente. El usuario no sabe qué hizo mal ni cómo corregirlo. |

### 5.6 Observaciones de Seguridad (no confirmadas como defectos)

| Observación | Contexto | Recomendación |
|-------------|----------|---------------|
| Mensajes de error de login | Se verificó que OSSN no revela si un usuario existe. Sin embargo, como buena práctica, se recomienda usar siempre un mensaje genérico como "Invalid credentials". | P3 — Revisar en futura auditoría de seguridad |

---

## 6. Métricas

### 6.1 Métricas de ejecución

| Métrica | Valor | Target | Status |
|---------|-------|--------|--------|
| Casos diseñados | 10 | >= 5 | **Cumple** |
| Casos ejecutados | 10/10 (100%) | >= 3 manuales | **Cumple** |
| Casos automatizados | 7/10 (70%) | >= 2 | **Cumple** |
| Tests Playwright passing | 23/23 (100%) | 100% | **Cumple** |
| Requisitos con cobertura | 6/6 (100%) | 100% | **Cumple** |
| Tiempo promedio de ejecución (suite completa) | ~90 segundos | < 5 minutos | **Cumple** |

### 6.2 Métricas de calidad

| Métrica | Valor | Target | Status |
|---------|-------|--------|--------|
| Defectos totales encontrados | 18 | — | Documentados |
| Defectos críticos abiertos | **0** | 0 para release | **Cumple** |
| Defectos altos abiertos | **8** | 0 idealmente | Requiere plan de remediación |
| Defectos por módulo (más afectado) | Accesibilidad (14) | — | Área de mayor riesgo |
| Densidad de defectos (bugs/página) | 4.5 bugs/página evaluada | — | Moderada |
| Elementos DOM con violaciones a11y | ~236 | 0 critical | **NO Cumple** |

### 6.3 Métricas de cobertura

| Requisito | Casos vinculados | Happy Path | Negativo | Cobertura |
|-----------|-----------------|------------|----------|-----------|
| REQ-01 Registro | 2 | 1 | 1 | Robusta |
| REQ-02 Login | 2 | 1 | 1 | Robusta |
| REQ-03 Imágenes | 2 | 1 | 1 | Robusta |
| REQ-04 Comentarios/Reacciones | 2 | 2 | 0 | Buena (falta negativo) |
| REQ-05 Mensajería | 1 | 1 | 0 | Básica (falta negativo) |
| REQ-06 Perfil | 1 | 1 | 0 | Básica (falta negativo) |

---

## 7. Conclusiones por Tipo de Prueba

### 7.1 Pruebas Funcionales

La aplicación cumple con los flujos happy path de las 6 funcionalidades principales. Un usuario puede registrarse, iniciar sesión, publicar contenido con imágenes, comentar, reaccionar, enviar mensajes y editar su perfil.

Las **pruebas negativas confirmaron que la validación de datos de entrada funciona correctamente** en los escenarios evaluados:

- **Registro:** OSSN valida correctamente la longitud mínima del password (5+ caracteres), rechaza emails con formato inválido, y no permite el envío de formularios vacíos.
- **Login:** OSSN rechaza credenciales incorrectas y campos vacíos sin crear sesión.
- **Upload:** La aplicación rechaza archivos no soportados, aunque el mensaje de error podría ser más informativo (BUG-018).

**Veredicto funcional:** Las funcionalidades core están operativas y las validaciones básicas de datos funcionan correctamente.

### 7.2 Pruebas de Seguridad

Aunque no se realizó un pentest completo (fuera del alcance de este reto), la validación de red reveló **hallazgos en la configuración de cookies**:

- **3 defectos de cookies** sin flags de seguridad estándar (HttpOnly, Secure)
- Las cookies de sesión se transmiten sin cifrado en conexiones HTTP

**Recomendación:**
1. Corregir flags de cookies (HttpOnly, Secure, SameSite)
2. Forzar HTTPS en toda la aplicación
3. Realizar un pentest completo con herramientas como OWASP ZAP o Burp Suite

### 7.3 Pruebas de Carga / Rendimiento

No se ejecutaron pruebas de carga formales en este ciclo (fuera del alcance del reto). Sin embargo, durante la ejecución se observó:

- **Tiempos de respuesta aceptables** en todas las páginas (< 3 segundos percibidos)
- **OSSN hace requests de fondo indefinidas** (background polling), lo que provocó que `networkidle` de Playwright nunca se resolviera. Se reemplazó por `domcontentloaded` + esperas explícitas.
- **No se detectaron errores 5xx** en ninguno de los flujos evaluados

**Recomendación para pruebas futuras:**
1. Usar k6 o Artillery para medir tiempos de respuesta bajo concurrencia
2. Definir SLOs: login < 2s, feed < 3s, upload < 5s
3. Evaluar el impacto del background polling en el consumo de recursos

### 7.4 Pruebas de Accesibilidad

Los resultados de la auditoría WCAG 2.1 AA revelan que la aplicación **no cumple** con los estándares mínimos de accesibilidad:

- **68+ imágenes sin texto alternativo** — la app es prácticamente inutilizable con lectores de pantalla
- **5 campos de formulario sin labels** — los formularios de registro y login no son navegables por teclado/voz
- **36 elementos con contraste insuficiente** — dificultan la lectura para usuarios con baja visión
- **Estructura semántica incorrecta** — listas mal formadas y botones sin nombres accesibles

**Impacto:** La aplicación no podría cumplir con regulaciones de accesibilidad como la ADA (Americans with Disabilities Act) o la normativa europea EN 301 549.

**Recomendación:** Incorporar axe-core como quality gate en el pipeline de CI/CD — 0 violaciones critical como requisito para merge.

---

## 8. Notas de Mejora para Pruebas Futuras

### 8.1 Ampliar cobertura de automatización

| Caso | Acción | Impacto |
|------|--------|---------|
| TC-06 (Comentar) | Automatizar con Playwright | Cobertura de regresión para REQ-04 |
| TC-07 (Like/Unlike) | Automatizar con Playwright | Validar toggle y contadores en cada build |
| TC-10 (Upload inválido) | Automatizar con Playwright | Prevenir regresiones en validación de archivos |
| Nuevos casos negativos | Mensajería: mensaje vacío, adjuntos. Perfil: avatar inválido, longitud máxima | Profundizar cobertura de REQ-05 y REQ-06 |

### 8.2 Ampliar cobertura de seguridad

| Área | Herramienta sugerida | Prioridad |
|------|---------------------|-----------|
| Headers de seguridad (CSP, HSTS, X-Frame-Options) | OWASP ZAP / Scripts custom | Alta |
| Sanitización de inputs (XSS en comentarios, mensajes, bio) | Playwright + payloads XSS | Alta |
| CSRF tokens en formularios | Inspección manual + automatización | Media |
| Rate limiting en login (prevención de fuerza bruta) | k6 / Artillery | Media |

### 8.3 Mejorar la suite de automatización

| Mejora | Beneficio |
|--------|-----------|
| Agregar `data-testid` a los componentes (requiere cooperación de dev) | Selectores estables, menos mantenimiento de tests |
| Implementar visual regression testing con Playwright screenshot comparison | Detectar cambios visuales inesperados |
| Agregar tests de API directos cuando se habilite OssnServices | Cobertura de integración sin depender de la UI |
| Parametrizar credenciales por entorno (dev, staging, prod) | Ejecutar la misma suite en múltiples entornos |

### 8.4 Integrar en el ciclo de desarrollo

| Acción | Beneficio |
|--------|-----------|
| Ejecutar suite en cada PR (ya configurado con GitHub Actions) | Prevención de regresiones |
| Agregar quality gates: 0 bugs critical para merge | Evitar que defectos de seguridad lleguen a producción |
| Dashboard de métricas de calidad (defectos por sprint, cobertura, trend) | Visibilidad para stakeholders |
| Shift-left: involucrar QA en el diseño de features, no solo en la validación | Prevenir defectos antes de que se escriba código |

---

## 9. Evidencias

### 9.1 Screenshots automatizados (generados por Playwright)

| Archivo | Caso | Descripción |
|---------|------|-------------|
| `evidencias/manual/TC-01-registro-exitoso.png` | TC-01 | Registro exitoso — formulario completo |
| `evidencias/manual/TC-02-campos-vacios.png` | TC-02 | Registro con campos vacíos — error mostrado |
| `evidencias/manual/TC-02-password-debil.png` | TC-02 | Password débil rechazado — error mostrado |
| `evidencias/manual/TC-02-email-invalido.png` | TC-02 | Email inválido rechazado |
| `evidencias/manual/TC-03-login-exitoso.png` | TC-03 | Login exitoso — feed visible |
| `evidencias/manual/TC-03-login-network.png` | TC-03 | Login — request HTTP capturada |
| `evidencias/manual/TC-04-password-incorrecto.png` | TC-04 | Login con password incorrecto |
| `evidencias/manual/TC-04-usuario-inexistente.png` | TC-04 | Login con usuario inexistente |
| `evidencias/manual/TC-04-campos-vacios.png` | TC-04 | Login con campos vacíos |
| `evidencias/manual/TC-05-post-imagen.png` | TC-05 | Post con imagen publicado |
| `evidencias/manual/TC-08-bandeja-mensajes.png` | TC-08 | Bandeja de mensajes (inbox) |
| `evidencias/manual/TC-08-enviar-mensaje.png` | TC-08 | Envío de mensaje privado |
| `evidencias/manual/TC-08-network-mensajes.png` | TC-08 | Network requests de mensajería |
| `evidencias/manual/TC-09-editar-perfil.png` | TC-09 | Edición de perfil (First Name) |
| `evidencias/manual/TC-09-perfil-nombre.png` | TC-09 | Perfil público con nombre visible |

### 9.2 Screenshots de pruebas manuales (TC-06, TC-07, TC-10)

Los screenshots de las pruebas manuales ejecutadas el 4 de marzo de 2026 documentan:

- **TC-06:** Comentario escrito + Comentario publicado con autor y timestamp
- **TC-07:** Estado "liked" (Unlike visible) + Estado "unliked" (Like visible)
- **TC-10:** Modal de error "Something went wrong! Cannot save the uploaded file."

### 9.3 Reporte HTML de Playwright

Disponible en `playwright-report/index.html`. Contiene el detalle completo de los 23 tests automatizados con tiempos de ejecución, traces y screenshots de fallo.

---

> **Nota final:** Este informe refleja el estado de la aplicación al momento de la ejecución (3–4 de marzo de 2026). Los defectos documentados son hallazgos reales verificados contra la demo pública de OSSN. En un contexto de proyecto real, cada defecto se priorizaría con el Product Owner y el equipo de desarrollo para definir el plan de remediación antes del release.
