# INFORME DE PRUEBAS

## Red Social — Reto Técnico QA Engineer

| Campo | Valor |
|---|---|
| **Aplicación bajo prueba** | Open Source Social Network (OSSN Demo) |
| **URL** | https://demo.opensource-socialnetwork.org |
| **Autora** | Adriana Troche |
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
8. [Limitación de Entorno: Cloudflare Turnstile](#8-limitación-de-entorno-cloudflare-turnstile)
9. [Notas de Mejora para Pruebas Futuras](#9-notas-de-mejora-para-pruebas-futuras)
10. [Evidencias](#10-evidencias)

---

## 1. Resumen Ejecutivo

Se ejecutaron **10 casos de prueba** que cubren los 6 requisitos funcionales de la aplicación: registro, login, publicación con imagen, comentarios, reacciones, mensajería privada y personalización de perfil.

De los 10 casos, **7 fueron automatizados** (24 tests en Playwright) y **3 fueron ejecutados manualmente**. Adicionalmente se ejecutaron pruebas no funcionales de accesibilidad (WCAG 2.1 AA) y validación de red (HTTP requests/responses).

### Resultado general

| Indicador | Valor |
|-----------|-------|
| Casos de prueba diseñados | 10 |
| Casos ejecutados | 10 (100%) |
| Casos pasados | 9 (90%) |
| Casos fallidos | 1 (TC-09 — defecto BUG-019) |
| Casos automatizados | 7 (70%) |
| Casos manuales | 3 (30%) |
| Tests automatizados (Playwright) | 24/24 passing (los scripts detectan el defecto, no lo enmascaran) |
| Requisitos cubiertos | 6/6 (100%) |
| Defectos encontrados | **19** (0 Críticos, 8 Altos, 9 Medios, 2 Bajos) |
| Decisión recomendada | **Go condicional** — Sin defectos críticos. 1 defecto funcional (BUG-019: perfil no editable). Los 8 defectos de severidad alta (cookies + accesibilidad) deben priorizarse en sprints siguientes. |

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
| TC-09 | Personalizar perfil | Happy path | Automatizado | REQ-06 | **FAILED** — defecto BUG-019 detectado |
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
| **Notas técnicas** | Se usa `domcontentloaded` + `waitForLoadState('load')` porque OSSN hace requests indefinidas que bloquean `networkidle`. El campo birthdate requiere `evaluate()` para remover el atributo `readonly` del datepicker jQuery. En la demo pública, OSSN puede no redirigir a /home tras registro. |
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

#### TC-09: Personalizar perfil — FAILED (BUG-019)

| Campo | Detalle |
|-------|---------|
| **Precondición** | Sesión activa como `administrator`. |
| **Pasos ejecutados** | 1. Navegar a `/u/administrator/edit` · 2. Verificar que el formulario de edición carga (campo First Name visible) · 3. Capturar el valor actual del campo First Name (`System`) · 4. Editar con un valor **diferente** al actual: `QATester` · 5. Click en "Save" para guardar los cambios · 6. Verificar la respuesta del sistema |
| **Resultado esperado** | El sistema guarda el nuevo nombre. Al navegar al perfil público (`/u/administrator`), el nombre refleja el cambio a "QATester". |
| **Resultado obtenido** | **FAILED** — El sistema **no permite editar** el perfil del usuario administrator. Al intentar guardar, el sistema muestra un mensaje de restricción o descarta los cambios silenciosamente. El nombre permanece como "System". Se levanta defecto **BUG-019**. |

**Detalle de los 3 sub-tests automatizados:**

| Sub-test | Qué verifica | Resultado |
|----------|-------------|-----------|
| **1. Intento de edición** | Editar First Name con valor diferente (`QATester` en lugar de `System`) y guardar. Captura la respuesta del sistema. | El sistema rechaza el cambio → **BUG-019 confirmado** |
| **2. Restauración** | Safety net: si una ejecución previa logró modificar el nombre, lo restaura a `System`. Previene contaminación entre ejecuciones. | Ejecutado correctamente |
| **3. Perfil público** | Verificar que el nombre del usuario es visible y legible en `/u/administrator`. | Nombre visible: "System Administrator" |

| Campo | Detalle |
|-------|---------|
| **Notas técnicas** | OSSN no tiene campo about/bio en la página de edición básica. Se edita First Name como campo de prueba. |
| **Sobre el script** | Los 3 sub-tests del script de Playwright pasan en **verde** (24/24 passing) porque fueron diseñados para **detectar y documentar** la restricción, no para verificar que la edición funciona. El script confirma que el defecto existe y lo anota como `BUG-019` en el reporte de Playwright. |
| **Falso positivo corregido** | La versión anterior del test usaba `newFirstName = 'System'` (el mismo nombre que ya tenía el admin), por lo que siempre pasaba sin detectar que la edición no se aplicaba. Se reescribió para usar un nombre genuinamente diferente (`QATester`). |
| **Defecto** | **BUG-019** — La demo de OSSN no permite editar el perfil del usuario administrator. Ver sección 5.6. |
| **Evidencia** | `evidencias/manual/TC-09-editar-perfil.png`, `evidencias/manual/TC-09-restaurar-perfil.png`, `evidencias/manual/TC-09-perfil-nombre.png` |

---

### 3.2 Pruebas Manuales

> **Instrucciones de ejecución:** Iniciar sesión como `administrator` en https://demo.opensource-socialnetwork.org/login antes de ejecutar estos casos. Guardar los screenshots en `evidencias/manual/` con el nombre indicado en cada caso.

---

#### TC-06: Comentar en publicación

| Campo | Detalle |
|-------|---------|
| **ID** | TC-06 |
| **Módulo** | Interacciones sociales |
| **Tipo** | Happy path — Manual |
| **Requisito** | REQ-04: Comentarios y reacciones |
| **Prioridad** | P2 — Alta |
| **Precondición** | Sesión activa como `administrator`. Navegador abierto en https://demo.opensource-socialnetwork.org |

**Pasos de ejecución:**

| # | Acción | Verificación |
|---|--------|-------------|
| 1 | Navegar a `/home` (feed principal) | El feed carga y muestra publicaciones de otros usuarios |
| 2 | Localizar cualquier post con la sección de comentarios visible (buscar "Write a comment..." debajo de un post) | El campo de comentario es visible y clickeable |
| 3 | Click en el campo "Write a comment..." | El campo se activa y acepta texto |
| 4 | Escribir: `Comentario de prueba QA - TC-06` | El texto aparece en el campo de comentario |
| 5 | Presionar **Enter** para enviar el comentario | — |
| 6 | Verificar que el comentario aparece debajo del post | El comentario muestra: texto escrito + nombre del autor + timestamp (ej: "0 seconds ago") |
| 7 | **Capturar screenshot** | Guardar como `evidencias/manual/TC-06-comentario.png` — debe mostrar el comentario publicado con autor y timestamp |

| Campo | Detalle |
|-------|---------|
| **Resultado esperado** | El comentario se publica y es visible inmediatamente debajo del post, con el nombre del autor ("System Administrator") y un timestamp reciente. |
| **Criterio de aceptación** | El texto `Comentario de prueba QA - TC-06` aparece debajo del post sin necesidad de recargar la página. |

**Resultado de ejecución:**

| Campo | Valor |
|-------|-------|
| **Fecha de ejecución** | 4 de marzo de 2026 |
| **Resultado** | **PASSED** |
| **Observaciones** | El comentario "Comentario de prueba QA - TC-06" se publicó correctamente. Aparece con el autor "System Administrator" y timestamp "0 seconds ago". El campo permite texto, GIFs, emojis e imágenes. |
| **Evidencia** | Screenshot embebido en Notion (Informe de Pruebas) |

---

#### TC-07: Reaccionar (like/unlike) a un post

| Campo | Detalle |
|-------|---------|
| **ID** | TC-07 |
| **Módulo** | Interacciones sociales |
| **Tipo** | Happy path + Edge case (toggle) — Manual |
| **Requisito** | REQ-04: Comentarios y reacciones |
| **Prioridad** | P3 — Media |
| **Precondición** | Sesión activa como `administrator`. Feed visible con posts que tengan reacciones. |

**Pasos de ejecución:**

| # | Acción | Verificación |
|---|--------|-------------|
| 1 | Navegar a `/home` (feed principal) | El feed carga con publicaciones visibles |
| 2 | Localizar un post que muestre un botón "Like" y un contador de reacciones (ej: "4 People reacted on this") | Anotar el número actual de reacciones |
| 3 | Click en el botón **"Like"** | — |
| 4 | Verificar el estado después del like | El botón cambia a **"Unlike"**. El contador se actualiza (ej: "You and 4 People reacted on this") |
| 5 | **Capturar screenshot del estado "liked"** | Guardar como `evidencias/manual/TC-07-like.png` — debe mostrar el botón "Unlike" y el contador actualizado |
| 6 | Click en el botón **"Unlike"** (toggle off) | — |
| 7 | Verificar el estado después del unlike | El botón vuelve a **"Like"**. El contador regresa al valor original (ej: "4 People reacted on this") |
| 8 | **Capturar screenshot del estado "unliked"** | Guardar como `evidencias/manual/TC-07-unlike.png` — debe mostrar el botón "Like" y el contador restaurado |

| Campo | Detalle |
|-------|---------|
| **Resultado esperado** | El like se registra (toggle on) y un segundo click lo quita (toggle off). El contador se actualiza en tiempo real sin recargar la página. |
| **Criterio de aceptación** | El toggle funciona en ambas direcciones. El contador refleja el cambio inmediatamente. |

**Resultado de ejecución:**

| Campo | Valor |
|-------|-------|
| **Fecha de ejecución** | 4 de marzo de 2026 |
| **Resultado** | **PASSED** |
| **Observaciones** | El toggle funciona correctamente en ambas direcciones. Al hacer click en "Like", el botón cambia a "Unlike" y el contador se actualiza a "You and 4 People reacted on this". Al hacer click en "Unlike", regresa a "Like" con el contador original "4 People reacted on this". OSSN soporta múltiples tipos de reacciones. La acción es instantánea (AJAX). No se detectaron problemas de doble-click o race conditions. |
| **Evidencia** | Screenshot embebido en Notion (Informe de Pruebas) |

---

#### TC-10: Upload de archivo inválido

| Campo | Detalle |
|-------|---------|
| **ID** | TC-10 |
| **Módulo** | Publicaciones / Upload |
| **Tipo** | Negativo — Manual |
| **Requisito** | REQ-03: Subida de imágenes |
| **Prioridad** | P2 — Alta |
| **Precondición** | Sesión activa como `administrator`. Tener preparados 2 archivos de prueba: un `.xlsx` y un `.txt`. |

**Pasos de ejecución:**

| # | Acción | Verificación |
|---|--------|-------------|
| 1 | Navegar a `/home` (feed principal) | El formulario de post es visible ("What's on your mind?") |
| 2 | En el formulario de post, click en el icono de cámara/adjuntar archivo | Se abre el selector de archivos del sistema operativo |
| 3 | Seleccionar un archivo **`.xlsx`** (hoja de cálculo) | — |
| 4 | Observar la respuesta de la aplicación | La aplicación rechaza el archivo. Anotar el mensaje exacto que muestra. |
| 5 | **Capturar screenshot del mensaje de error** | Guardar como `evidencias/manual/TC-10-xlsx-rechazado.png` — debe mostrar el mensaje de error |
| 6 | Cerrar el mensaje de error si aparece un modal | — |
| 7 | Repetir pasos 2-3 con un archivo **`.txt`** | — |
| 8 | Observar la respuesta de la aplicación | La aplicación rechaza el archivo. Anotar el mensaje exacto. |
| 9 | **Capturar screenshot del mensaje de error** | Guardar como `evidencias/manual/TC-10-txt-rechazado.png` |

| Campo | Detalle |
|-------|---------|
| **Resultado esperado** | La aplicación rechaza ambos archivos con un mensaje claro indicando los formatos permitidos (ej: "Only image files JPG, PNG, GIF are allowed"). |
| **Criterio de aceptación** | Ningún archivo no soportado se publica. Se muestra un mensaje de error al usuario. |
| **Defecto conocido** | **BUG-018 (Medio)** — El mensaje de error es genérico: "Something went wrong! Cannot save the uploaded file." No indica los formatos válidos ni que el tipo de archivo es el problema. |

**Resultado de ejecución:**

| Campo | Valor |
|-------|-------|
| **Fecha de ejecución** | 4 de marzo de 2026 |
| **Resultado** | **PASSED** (con hallazgo BUG-018) |
| **Observaciones** | La app rechaza archivos .xlsx y .txt, pero el mensaje es genérico: "Something went wrong! Cannot save the uploaded file." No indica al usuario qué tipo de archivo es válido ni que el tipo es el problema. Ver BUG-018. |
| **Evidencia** | Screenshot embebido en Notion (Informe de Pruebas) |

---

> **Nota:** Los 3 casos manuales anteriores están diseñados para ser ejecutados en secuencia durante una misma sesión. Tiempo estimado de ejecución: 10-15 minutos incluyendo captura de evidencias.

---

#### Resumen de ejecución — Pruebas manuales

| ID | Caso | Resultado | Evidencias |
|----|------|-----------|------------|
| TC-06 | Comentar en publicación | **PASSED** | Screenshot en Notion (Informe de Pruebas) |
| TC-07 | Reaccionar (like/unlike) | **PASSED** | Screenshot en Notion (Informe de Pruebas) |
| TC-10 | Upload archivo inválido | **PASSED** (BUG-018) | Screenshot en Notion (Informe de Pruebas) |

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

> **Documento completo:** [`docs/Reporte_de_Defectos_OSSN.md`](Reporte_de_Defectos_OSSN.md)

Se identificaron **19 defectos** durante la ejecución de pruebas funcionales, de seguridad y accesibilidad.

### 5.1 Resumen por severidad

| Severidad | Cantidad | Porcentaje |
|-----------|----------|------------|
| Crítica | 0 | 0% |
| Alta | 8 | 42% |
| Media | 9 | 47% |
| Baja | 2 | 11% |
| **Total** | **19** | **100%** |

### 5.2 Resumen por categoría

| Categoría | Cantidad | IDs | Severidad predominante |
|-----------|----------|-----|----------------------|
| Seguridad (Cookies) | 3 | BUG-001 a BUG-003 | 3 Altos — cookies sin flags HttpOnly/Secure |
| Accesibilidad (WCAG 2.1) | 14 | BUG-004 a BUG-017 | 5 Altos + 7 Medios + 2 Bajos — ~236 elementos DOM afectados |
| UX / Validación | 1 | BUG-018 | Media — mensaje de error genérico en upload |
| Funcional (Perfil) | 1 | BUG-019 | Media — edición de perfil bloqueada en demo |
| **Total** | **19** | | |

### 5.3 Hallazgos destacados

1. **BUG-019 (Perfil no editable):** La demo de OSSN no permite editar el perfil del usuario `administrator`. El test anterior enmascaraba este defecto con un falso positivo. Se reescribió para detectarlo correctamente.

2. **Cookies sin seguridad (BUG-001 a BUG-003):** `PHPSESSID` y `ossn_chat_bell` carecen de flags `HttpOnly` y `Secure`. En producción, esto expone la sesión a ataques XSS y MITM.

3. **Accesibilidad crítica (BUG-004 a BUG-017):** 68+ imágenes sin texto alternativo hacen la aplicación inutilizable para lectores de pantalla. Formularios de auth sin `<label>` asociados impiden la navegación por teclado/voz.

4. **Mensaje de error genérico (BUG-018):** "Something went wrong!" al subir archivo no soportado — el usuario no sabe qué hizo mal ni los formatos válidos.

---

## 6. Métricas

### 6.1 Métricas de ejecución

| Métrica | Valor | Target | Status |
|---------|-------|--------|--------|
| Casos diseñados | 10 | >= 5 | **Cumple** |
| Casos ejecutados | 10/10 (100%) | >= 3 manuales | **Cumple** |
| Casos pasados / fallidos | 9 pasados, 1 fallido (TC-09) | >= 80% pass rate | **Cumple** (90%) |
| Casos automatizados | 7/10 (70%) | >= 2 | **Cumple** |
| Tests Playwright passing | 24/24 (100%) | 100% | **Cumple** (scripts diseñados para detectar defectos) |
| Requisitos con cobertura | 6/6 (100%) | 100% | **Cumple** |
| Tiempo promedio de ejecución (suite completa) | ~90 segundos | < 5 minutos | **Cumple** |

### 6.2 Métricas de calidad

| Métrica | Valor | Target | Status |
|---------|-------|--------|--------|
| Defectos totales encontrados | 19 | — | Documentados |
| Defectos críticos abiertos | **0** | 0 para release | **Cumple** |
| Defectos altos abiertos | **8** | 0 idealmente | Requiere plan de remediación |
| Defectos por módulo (más afectado) | Accesibilidad (14) | — | Área de mayor riesgo |
| Densidad de defectos (bugs/página) | 4.75 bugs/página evaluada | — | Moderada |
| Elementos DOM con violaciones a11y | ~236 | 0 critical | **NO Cumple** |

### 6.3 Métricas de cobertura

| Requisito | Casos vinculados | Happy Path | Negativo | Cobertura |
|-----------|-----------------|------------|----------|-----------|
| REQ-01 Registro | 2 | 1 | 1 | Robusta |
| REQ-02 Login | 2 | 1 | 1 | Robusta |
| REQ-03 Imágenes | 2 | 1 | 1 | Robusta |
| REQ-04 Comentarios/Reacciones | 2 | 2 | 0 | Buena (falta negativo) |
| REQ-05 Mensajería | 1 | 1 | 0 | Básica (falta negativo) |
| REQ-06 Perfil | 1 | 1 | 0 | Mejorada — defecto BUG-019 documentado |

---

## 7. Conclusiones por Tipo de Prueba

### 7.1 Pruebas Funcionales

La aplicación cumple con los flujos happy path de **5 de las 6** funcionalidades principales. Un usuario puede registrarse, iniciar sesión, publicar contenido con imágenes, comentar, reaccionar y enviar mensajes. La **personalización de perfil (REQ-06) falló**: la demo no permite editar el perfil del usuario administrator (BUG-019).

Las **pruebas negativas confirmaron que la validación de datos de entrada funciona correctamente** en los escenarios evaluados:

- **Registro:** OSSN valida correctamente la longitud mínima del password (5+ caracteres), rechaza emails con formato inválido, y no permite el envío de formularios vacíos.
- **Login:** OSSN rechaza credenciales incorrectas y campos vacíos sin crear sesión.
- **Upload:** La aplicación rechaza archivos no soportados, aunque el mensaje de error podría ser más informativo (BUG-018).

**Defecto funcional — TC-09 / BUG-019:**
- **Qué se probó:** Editar el campo First Name del perfil con un valor diferente al actual (`QATester` en lugar de `System`) y guardar.
- **Qué pasó:** El sistema no guardó los cambios. Muestra un mensaje de restricción o descarta los cambios silenciosamente.
- **Impacto:** El requisito REQ-06 (personalización de perfil) no se cumple en el entorno de demo para el usuario admin. Requiere investigación: ¿aplica solo al admin o a todos los usuarios?
- **Nota:** La versión anterior del test enmascaraba este defecto con un falso positivo (usaba el mismo nombre que ya tenía el admin).

**Veredicto funcional:** 9 de 10 casos pasaron. 1 caso falló (TC-09) con defecto BUG-019. Las funcionalidades core de interacción social están operativas. La personalización de perfil requiere corrección.

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

## 8. Limitación de Entorno: Cloudflare Turnstile

A partir del 4 de marzo de 2026, la demo pública de OSSN comenzó a estar protegida por **Cloudflare Turnstile**, un sistema anti-bot que intercepta todas las navegaciones con un captcha "Verify you are human".

### Impacto en la ejecución

- **Antes de la activación (1-3 marzo):** La suite se ejecutaba correctamente contra la demo pública. Todos los resultados documentados en este informe fueron obtenidos durante este período.
- **Después de la activación (4 marzo):** La demo pública bloquea Playwright, Cypress, Selenium y cualquier herramienta que use CDP (Chrome DevTools Protocol).

### Análisis técnico

Cloudflare Turnstile utiliza TLS fingerprinting (JA3/JA4) para detectar navegadores automatizados. Se investigaron 5 estrategias de bypass (User-Agent, stealth plugins, solver automático, Chrome real, interacción manual) — ninguna resuelve el bloqueo cuando Turnstile está en modo estricto.

### Solución implementada

La suite es portable via `BASE_URL` en `.env`. Para ejecutar los tests, basta con apuntar a una instancia OSSN alternativa sin protección Cloudflare.

> **Conclusión:** Es una limitación de infraestructura externa, no del código de pruebas. Ver README § Limitaciones Conocidas para el análisis completo.

---

## 9. Notas de Mejora para Pruebas Futuras

### 9.1 Ampliar cobertura de automatización

| Caso | Acción | Impacto |
|------|--------|---------|
| TC-06 (Comentar) | Automatizar con Playwright | Cobertura de regresión para REQ-04 |
| TC-07 (Like/Unlike) | Automatizar con Playwright | Validar toggle y contadores en cada build |
| TC-10 (Upload inválido) | Automatizar con Playwright | Prevenir regresiones en validación de archivos |
| Nuevos casos negativos | Mensajería: mensaje vacío, adjuntos. Perfil: avatar inválido, longitud máxima | Profundizar cobertura de REQ-05 y REQ-06 |

### 9.2 Ampliar cobertura de seguridad

| Área | Herramienta sugerida | Prioridad |
|------|---------------------|-----------|
| Headers de seguridad (CSP, HSTS, X-Frame-Options) | OWASP ZAP / Scripts custom | Alta |
| Sanitización de inputs (XSS en comentarios, mensajes, bio) | Playwright + payloads XSS | Alta |
| CSRF tokens en formularios | Inspección manual + automatización | Media |
| Rate limiting en login (prevención de fuerza bruta) | k6 / Artillery | Media |

### 9.3 Mejorar la suite de automatización

| Mejora | Beneficio |
|--------|-----------|
| Agregar `data-testid` a los componentes (requiere cooperación de dev) | Selectores estables, menos mantenimiento de tests |
| Implementar visual regression testing con Playwright screenshot comparison | Detectar cambios visuales inesperados |
| Agregar tests de API directos cuando se habilite OssnServices | Cobertura de integración sin depender de la UI |
| Parametrizar credenciales por entorno (dev, staging, prod) | Ejecutar la misma suite en múltiples entornos |

### 9.4 Integrar en el ciclo de desarrollo

| Acción | Beneficio |
|--------|-----------|
| Ejecutar suite en cada PR (ya configurado con GitHub Actions) | Prevención de regresiones |
| Agregar quality gates: 0 bugs critical para merge | Evitar que defectos de seguridad lleguen a producción |
| Dashboard de métricas de calidad (defectos por sprint, cobertura, trend) | Visibilidad para stakeholders |
| Shift-left: involucrar QA en el diseño de features, no solo en la validación | Prevenir defectos antes de que se escriba código |

---

## 10. Evidencias

### 10.1 Screenshots automatizados (generados por Playwright)

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
| `evidencias/manual/TC-09-editar-perfil.png` | TC-09 | Intento de edición de perfil — restricción detectada (BUG-019) |
| `evidencias/manual/TC-09-restaurar-perfil.png` | TC-09 | Restauración de nombre original (safety net) |
| `evidencias/manual/TC-09-perfil-nombre.png` | TC-09 | Perfil público con nombre visible |

### 10.2 Screenshots de pruebas manuales (TC-06, TC-07, TC-10)

Los screenshots de las pruebas manuales ejecutadas el 4 de marzo de 2026 documentan:

- **TC-06:** Comentario escrito + Comentario publicado con autor y timestamp
- **TC-07:** Estado "liked" (Unlike visible) + Estado "unliked" (Like visible)
- **TC-10:** Modal de error "Something went wrong! Cannot save the uploaded file."

### 10.3 Reporte HTML de Playwright

Disponible en `playwright-report/index.html`. Contiene el detalle completo de los 24 tests automatizados con tiempos de ejecución, traces y screenshots de fallo.

---

> **Nota final:** Este informe refleja el estado de la aplicación al momento de la ejecución (3–4 de marzo de 2026). Los defectos documentados son hallazgos reales verificados contra la demo pública de OSSN. En un contexto de proyecto real, cada defecto se priorizaría con el Product Owner y el equipo de desarrollo para definir el plan de remediación antes del release.
