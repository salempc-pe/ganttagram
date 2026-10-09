# STACK.md — Stack Tecnológico y Versiones Fijas

## 1. Entorno de Ejecución (Runtimes)
| Tecnología | Versión | Propósito |
|---|---|---|
| **Node.js** | `>= 18.0.0` | Entorno de desarrollo, scripts y compilación |
| **Navegador** | Evergreen (Chrome, Firefox, Safari, Edge) | Entorno de ejecución web cliente |
| **Rust / Tauri** | `v2.x` | Wrapper nativo para compilar aplicación de escritorio multiplataforma |

---

## 2. Dependencias de Producción (Fijas y Aprobadas)
| Paquete | Versión Exacta / Rango | Propósito Oficial |
|---|---|---|
| `react` | `^18.3.1` | Biblioteca base de interfaz de usuario |
| `react-dom` | `^18.3.1` | Renderizado para el DOM |
| `react-router-dom` | `^7.13.0` | Enrutamiento SPA cliente |
| `firebase` | `^12.8.0` | Backend-as-a-Service (Firestore en tiempo real y Auth) |
| `gantt-task-react` | `^0.3.9` | Componente base para renderizado del cronograma Gantt |
| `lucide-react` | `^0.563.0` | Sistema oficial y único de iconos SVG técnicos |
| `date-fns` | `^4.1.0` | Utilidad oficial y única para manipulación de fechas |
| `clsx` | `^2.1.1` | Composición condicional de clases CSS |

---

## 3. Dependencias de Desarrollo y Herramientas (Fijas)
| Paquete | Versión | Propósito Oficial |
|---|---|---|
| `vite` | `^7.2.4` | Bundler y servidor de desarrollo ultrarrápido |
| `@vitejs/plugin-react` | `^5.1.1` | Integración de React y Fast Refresh en Vite |
| `vite-plugin-pwa` | `^1.2.0` | Service Worker y capacidades PWA offline |
| `vitest` | `^4.0.18` | Framework de pruebas unitarias y de integración |
| `@testing-library/react` | `^16.3.2` | Pruebas de integración de componentes React |
| `@testing-library/jest-dom` | `^6.9.1` | Matchers semánticos para el DOM |
| `@testing-library/user-event`| `^14.6.1` | Simulación realista de eventos de usuario |
| `jsdom` | `^28.1.0` | Entorno de simulación DOM para Vitest |
| `eslint` | `^9.39.1` | Linter de código estático |
| `@tauri-apps/api` | `^2.10.1` | API cliente de comunicación con Tauri |
| `@tauri-apps/cli` | `^2.10.1` | CLI para empaquetado de escritorio |
| `autoprefixer` | `^10.4.24` | Prefijos automáticos de CSS |
| `cssnano` | `^7.1.2` | Minificación de hojas de estilo en build |

---

## 4. Política Anti-Duplicación (Dependencias Prohibidas)
Para prevenir la saturación de dependencias y evitar incompatibilidades, se prohíbe taxativamente la instalación o importación de paquetes que dupliquen capacidades ya cubiertas:
- ❌ **Manejo de fechas**: NO instalar `moment`, `dayjs`, ni `luxon`. Toda operación de fechas debe utilizar exclusivamente `date-fns` o las utilidades nativas de `src/shared/utils/calendar.js`.
- ❌ **Iconografía**: NO instalar `heroicons`, `react-icons`, `@font-awesome`, ni emojis en la UI. Utilizar únicamente `lucide-react`.
- ❌ **Frameworks CSS redundantes**: NO instalar `tailwindcss` ni librerías de componentes UI monolíticas (`mui`, `chakra`, `ant-design`). El proyecto utiliza Vanilla CSS estructurado con variables semánticas (Design Tokens).
- ❌ **Librerías de Gantt alternativas**: NO agregar librerías paralelas de Gantt (ej. `dhtmlx-gantt`, `frappe-gantt`). Todo el motor visual se basa en `gantt-task-react` personalizado.
