# REPORTE DE DEFECTOS

## Red Social — Reto Técnico QA Engineer

| Campo | Valor |
|---|---|
| **Aplicación bajo prueba** | Open Source Social Network (OSSN Demo) |
| **URL** | https://demo.opensource-socialnetwork.org |
| **Autora** | Adriana Troche |
| **Fecha** | Marzo 2026 |
| **Total de defectos** | 19 |
| **Defectos críticos** | 0 |
| **Defectos altos** | 8 |
| **Documento relacionado** | `docs/Informe_de_Pruebas_OSSN.md` |

---

## 1. Resumen por Severidad

| Severidad | Cantidad | Porcentaje |
|-----------|----------|------------|
| Crítica | 0 | 0% |
| Alta | 8 | 42% |
| Media | 9 | 47% |
| Baja | 2 | 11% |
| **Total** | **19** | **100%** |

## 2. Resumen por Categoría

| Categoría | Cantidad | Severidad predominante |
|-----------|----------|----------------------|
| Seguridad (Cookies) | 3 | 3 Altos |
| Accesibilidad (WCAG 2.1) | 14 | 5 Altos + 7 Medios + 2 Bajos |
| UX / Validación | 1 | 1 Medio |
| Funcional (Perfil) | 1 | 1 Medio |
| **Total** | **19** | |

---

## 3. Defectos de Seguridad (Cookies)

### BUG-001 — Cookie `ossn_chat_bell` sin flag HttpOnly

| Campo | Detalle |
|-------|---------|
| **ID** | BUG-001 |
| **Severidad** | **ALTA** |
| **Prioridad** | P2 |
| **Módulo** | Seguridad / Cookies |
| **Encontrado en** | Network validation (cookies) |
| **Descripción** | La cookie `ossn_chat_bell` no tiene el flag `HttpOnly`, lo que permite que scripts del lado del cliente (JavaScript) la lean. En caso de una vulnerabilidad XSS, un atacante podría exfiltrar esta cookie. |
| **Remediación** | Agregar flag `HttpOnly` a todas las cookies que no necesiten ser accedidas por JavaScript. |

### BUG-002 — Cookie `PHPSESSID` sin flag Secure

| Campo | Detalle |
|-------|---------|
| **ID** | BUG-002 |
| **Severidad** | **ALTA** |
| **Prioridad** | P2 |
| **Módulo** | Seguridad / Cookies |
| **Encontrado en** | Network validation (cookies) |
| **Descripción** | La cookie de sesión `PHPSESSID` no tiene el flag `Secure`, lo que significa que se transmite en conexiones HTTP no cifradas. Vulnerable a ataques Man-in-the-Middle (MITM). |
| **Remediación** | Configurar `session.cookie_secure = 1` en PHP y forzar HTTPS. |

### BUG-003 — Cookie `ossn_chat_bell` sin flag Secure

| Campo | Detalle |
|-------|---------|
| **ID** | BUG-003 |
| **Severidad** | **ALTA** |
| **Prioridad** | P2 |
| **Módulo** | Seguridad / Cookies |
| **Encontrado en** | Network validation (cookies) |
| **Descripción** | La cookie `ossn_chat_bell` no tiene el flag `Secure`. Misma vulnerabilidad que BUG-002. |

---

## 4. Defectos de Accesibilidad (WCAG 2.1 AA)

### BUG-004 a BUG-017 — Violaciones de accesibilidad

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

---

## 5. Defectos de UX / Validación

### BUG-018 — Mensaje de error genérico al subir archivo inválido

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

---

## 6. Defectos Funcionales (Perfil)

### BUG-019 — La demo de OSSN no permite editar el perfil del usuario administrator

| Campo | Detalle |
|-------|---------|
| **ID** | BUG-019 |
| **Severidad** | **MEDIA** |
| **Prioridad** | P3 |
| **Módulo** | Perfil / Edición |
| **Encontrado en** | TC-09 (personalizar perfil — automatizado) |
| **Descripción** | Al intentar editar el campo First Name del usuario `administrator` en `/u/administrator/edit` con un valor diferente al actual (`QATester` en lugar de `System`), el sistema muestra un mensaje de restricción/error al guardar, o descarta los cambios silenciosamente sin notificar al usuario. El perfil no se modifica. |
| **Resultado esperado** | El sistema debería permitir editar el perfil del usuario, o si existe una restricción para el admin de la demo, debería indicarlo claramente antes de que el usuario intente guardar (no después). |
| **Impacto** | La funcionalidad de personalización de perfil (REQ-06) no es verificable en el entorno de demo para el usuario admin. No se puede confirmar si esta restricción aplica a todos los usuarios o solo al administrador. |
| **Contexto adicional** | La versión anterior del test automatizado enmascaraba este defecto usando `newFirstName = 'System'` (el mismo nombre que ya tenía el admin), generando un falso positivo. El test fue reescrito para detectar correctamente esta restricción. |

---

## 7. Observaciones de Seguridad (no confirmadas como defectos)

| Observación | Contexto | Recomendación |
|-------------|----------|---------------|
| Mensajes de error de login | Se verificó que OSSN no revela si un usuario existe. Sin embargo, como buena práctica, se recomienda usar siempre un mensaje genérico como "Invalid credentials". | P3 — Revisar en futura auditoría de seguridad |

---

> **Nota:** Este reporte complementa el Informe de Pruebas (`docs/Informe_de_Pruebas_OSSN.md`). Cada defecto fue verificado contra la demo pública de OSSN el 3-4 de marzo de 2026. En un contexto de proyecto real, cada defecto se priorizaría con el Product Owner y el equipo de desarrollo para definir el plan de remediación.
