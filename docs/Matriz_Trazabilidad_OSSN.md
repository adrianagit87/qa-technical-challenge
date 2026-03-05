# MATRIZ DE TRAZABILIDAD — Reto Técnico QA Engineer

**Aplicación:** OSSN Demo (demo.opensource-socialnetwork.org) | **Autora:** Adriana Troche | **Fecha:** Marzo 2026 | **Versión:** 2.0

---

## Hoja 1: Matriz de Trazabilidad

| ID Requisito | Requisito | Descripción | TC-01 | TC-02 | TC-03 | TC-04 | TC-05 | TC-06 | TC-07 | TC-08 | TC-09 | TC-10 | Casos vinculados | Cobertura | Happy path | Negativo | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| | | | Registro exitoso | Registro datos inválidos | Login exitoso | Login credenciales inválidas | Publicar imagen con descripción | Comentar en publicación | Reaccionar (like) a post | Acceder a bandeja y enviar mensaje | Personalizar perfil (BUG-019) | Upload archivo inválido | | | | | |
| REQ-01 | Registro de usuario | El sistema debe permitir crear una cuenta de usuario mediante un formulario con nombre, email, contraseña, fecha de nacimiento y género | ✓ | ✓ | — | — | — | — | — | — | — | — | 2 | 20% | 1 | 1 | Cubierto |
| REQ-02 | Inicio de sesión | El sistema debe permitir iniciar sesión con email/username y contraseña, validando credenciales contra la base de datos | — | — | ✓ | ✓ | — | — | — | — | — | — | 2 | 20% | 1 | 1 | Cubierto |
| REQ-03 | Subida de imágenes | El sistema debe permitir subir imágenes (JPG, PNG) con descripción de texto como publicación visible en el feed | — | — | — | — | ✓ | — | — | — | — | ✓ | 2 | 20% | 1 | 1 | Cubierto |
| REQ-04 | Comentarios y reacciones | El sistema debe permitir comentar y reaccionar (like) a publicaciones de otros usuarios | — | — | — | — | — | ✓ | ✓ | — | — | — | 2 | 20% | 2 | 0 | Cubierto |
| REQ-05 | Mensajería privada | El sistema debe permitir acceder a la bandeja de mensajes, abrir conversaciones existentes y enviar mensajes entre usuarios registrados | — | — | — | — | — | — | — | ✓ | — | — | 1 | 10% | 1 | 0 | Cubierto — automatizado con network validation |
| REQ-06 | Personalización de perfil | El sistema debe permitir editar información personal (First Name en Basic Settings) y verificar la persistencia de cambios en el perfil público | — | — | — | — | — | — | — | — | ✓ | — | 1 | 10% | 1 | 0 | Cubierto — automatizado con detección de defecto BUG-019 (restricción de edición en demo) |
| **TOTALES** | | | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | | **6/6 cubiertos** | | | **6 robustos** |

> **NOTA:** Cobertura de requisitos indica que cada requisito tiene al menos 1 caso vinculado. No implica profundidad suficiente. Ver hoja "Resumen de Cobertura" para análisis de gaps y recomendaciones de expansión por requisito.

---

## Hoja 2: Resumen de Cobertura por Requisito

### Análisis de gaps y recomendaciones

| ID | Requisito | Casos | Happy | Negativo | Automatizado | Gap / Recomendación |
|---|---|---|---|---|---|---|
| REQ-01 | Registro de usuario | 2 | 1 | 1 | Si | Cubierto. 1 happy + 1 negativo. El datepicker jQuery (readonly) se maneja via `evaluate()` para setear el valor directamente en el DOM. Considerar agregar: registro con caracteres especiales en nombre, email con dominios edge case (.museum, .co.uk). |
| REQ-02 | Inicio de sesión | 2 | 1 | 1 | Si | Cubierto. 1 happy + 1 negativo. Login exitoso usa `waitForURL('**/home**')` como indicador confiable (no `.topbar`). Login fallido usa `isLoggedIn()` con selector `.ossn-menu-dropdown`. Considerar agregar: test de sesión expirada, login desde múltiples dispositivos simultáneamente. |
| REQ-03 | Subida de imágenes | 2 | 1 | 1 | Si (happy) / Manual (negativo) | Cubierto. 1 happy + 1 negativo (archivo inválido). La verificación de post usa `getByText()` en lugar de selectores CSS. Considerar agregar: upload de imagen > tamaño máximo, formatos adicionales (WebP, GIF). |
| REQ-04 | Comentarios y reacciones | 2 | 2 | 0 | No (ambos manuales) | Cubierto con 2 happy path. Gap: no hay caso negativo. Agregar: comentario vacío, comentario con HTML/scripts (XSS), reacción sin sesión activa. |
| REQ-05 | Mensajería privada | 1 | 1 | 0 | Si (3 tests automatizados) | Cubierto y automatizado. Incluye: acceso a bandeja `/messages`, apertura de conversación existente (extrae URL del atributo `onclick="Ossn.redirect(...)"` de los items `div.ossn-recent-message-item`), envío de mensaje con verificación, y validación de network requests. NO se usa `/messages/send/{username}` (no existe en OSSN). Expandir con: mensaje vacío, mensaje con adjunto, conversación con usuario bloqueado. |
| REQ-06 | Personalización de perfil | 1 | 1 | 0 | Si (3 tests automatizados) | Cubierto y automatizado. Incluye: intento de edición de First Name con detección de restricción del sistema (BUG-019), test de restauración (safety net), y verificación de nombre en perfil público. **HALLAZGO:** La demo de OSSN no permite editar el perfil del admin — el test fue refactorizado para detectar esta restricción en lugar de enmascararla con un falso positivo. Expandir con: verificar si la restricción aplica solo al admin o a todos los usuarios, upload de avatar, First Name con longitud máxima. |

### Cambios respecto a v1.0

| Requisito | v1.0 | v2.0 | Cambio |
|---|---|---|---|
| REQ-05 (Mensajería) | Cobertura mínima — 1 caso manual | Cubierto — 3 tests automatizados | TC-08 automatizado: acceso a bandeja `/messages` + apertura de conversación existente + envío de mensaje + network validation |
| REQ-06 (Perfil) | Cobertura mínima — 1 caso manual | Cubierto — 3 tests automatizados | TC-09 refactorizado: detección de restricción de edición (BUG-019) + restauración de estado + verificación de nombre en perfil público. Eliminado falso positivo de v1.0 |

---

## Hoja 3: Inventario Completo de Casos de Prueba

| ID | Caso de prueba | Módulo | Tipo | Ejecución | Proyecto Playwright | Requisitos cubiertos | Prioridad |
|---|---|---|---|---|---|---|---|
| TC-01 | Registro exitoso | Auth | Happy path | Automatizado | `auth-tests` | REQ-01 | P1 - Crítica |
| TC-02 | Registro datos inválidos | Auth | Negativo | Automatizado | `auth-tests` | REQ-01 | P1 - Crítica |
| TC-03 | Login exitoso | Auth | Happy path | Automatizado | `auth-tests` | REQ-02 | P1 - Crítica |
| TC-04 | Login credenciales inválidas | Auth | Negativo | Automatizado | `auth-tests` | REQ-02 | P1 - Crítica |
| TC-05 | Publicar imagen con descripción | Social | Happy path | Automatizado | `authenticated` | REQ-03 | P2 - Alta |
| TC-06 | Comentar en publicación | Social | Happy path | Manual | — | REQ-04 | P2 - Alta |
| TC-07 | Reaccionar (like) a post | Social | Happy + Edge | Manual | — | REQ-04 | P3 - Media |
| TC-08 | Acceder a bandeja y enviar mensaje | Mensajería | Happy path | Automatizado | `authenticated` | REQ-05 | P2 - Alta |
| TC-09 | Personalizar perfil (detección de restricción) | Perfil | Happy path + Defecto | Automatizado | `authenticated` | REQ-06 | P3 - Media |
| TC-10 | Upload archivo inválido | Social | Negativo | Manual | — | REQ-03 | P2 - Alta |

### Resumen de ejecución

| Tipo de ejecución | Cantidad | Porcentaje |
|---|---|---|
| Automatizado | 7 | 70% |
| Manual | 3 | 30% |
| **Total** | **10** | **100%** |

### Detalle de tests automatizados (24 tests en 9 archivos)

| Archivo | Proyecto | Tests | Casos cubiertos |
|---|---|---|---|
| `fixtures/auth.setup.ts` | `setup` | 1 | (Setup de sesión) |
| `tests/auth/register.spec.ts` | `auth-tests` | 1 | TC-01 |
| `tests/auth/register-negative.spec.ts` | `auth-tests` | 3 | TC-02 |
| `tests/auth/login.spec.ts` | `auth-tests` | 5 | TC-03, TC-04 |
| `tests/social/post-image.spec.ts` | `authenticated` | 1 | TC-05 |
| `tests/accessibility/a11y-audit.spec.ts` | `authenticated` | 4 | (Extra B+) |
| `tests/api/network-validation.spec.ts` | `authenticated` | 3 | (Extra B+) |
| `tests/messaging/private-messages.spec.ts` | `authenticated` | 3 | TC-08 |
| `tests/profile/edit-profile.spec.ts` | `authenticated` | 3 | TC-09 |
| **Total** | | **24** | |
