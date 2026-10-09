# RULES.md — Restricciones y Reglas Operativas (Guardrails)

Este archivo define los **límites negativos estrictos** que rigen todas las intervenciones de código en **GANTTAGRAM**. Su objetivo es garantizar la autonomía confiable de los agentes de IA, prevenir regresiones y salvaguardar la estabilidad de la plataforma.

---

## 1. Guardrails de Dependencias y Entorno (Qué NO Hacer)
- 🚫 **Prohibido instalar paquetes sin autorización**: No ejecutar `npm install <nuevo-paquete>` ni añadir dependencias al `package.json` sin aprobación expresa y justificada del usuario.
- 🚫 **Prohibido duplicar librerías del stack**: Respetar estrictamente el inventario de [STACK.md](./STACK.md). Queda prohibido introducir alternativas redundantes para fechas (`moment`, `dayjs`), iconos (`react-icons`, `heroicons`) o estilos.
- 🚫 **Prohibido alterar configuraciones globales**: No modificar archivos estructurales como `vite.config.js`, `firebase.json`, `firestore.rules`, `.firebaserc`, `eslint.config.js` ni `src-tauri/tauri.conf.json` a menos que la tarea lo solicite explícitamente.
- 🚫 **Prohibido realizar despliegues no autorizados**: La infraestructura web oficial es exclusivamente Firebase Hosting; no realizar despliegues sin solicitud expresa.
- 🔄 **Sincronización Obligatoria Firebase ↔ GitHub**: **Siempre que se despliegue a Firebase, se debe sincronizar obligatoriamente a GitHub (commit y push), y viceversa**. Ningún despliegue en producción debe quedar desfasado del repositorio de control de versiones.

---

## 2. Convenciones de Código y Arquitectura
- 🚫 **Evitar tipado laxo (`any`) o mutaciones directas**: No usar tipos ambiguos o mutar directamente objetos de estado de React o snapshots de Firestore.
- 🚫 **No dispersar lógica de negocio en la UI**: Los componentes visuales deben ser declarativos. Todo cálculo de fechas, dependencias o jerarquías debe residir en `src/features/tasks/utils/` (`scheduler.js`, `hierarchy.js`).
- 🚫 **Respetar la estructura Feature-First**: No crear carpetas arbitrarias en la raíz de `src/`. Todo nuevo desarrollo debe pertenecer a `src/features/<feature>/`, `src/shared/` o `src/services/`.
- 🚫 **No suprimir ni romper tests existentes**: Ningún cambio debe resolver un problema desactivando pruebas unitarias o bajando las aserciones de `vitest`.

---

## 3. Preservación del Sistema Visual (UI/UX)
- 🚫 **No introducir interfaces genéricas**: Seguir al pie de la letra [DESIGN.md](./DESIGN.md) (*Industrial-Tech Premium / Technical Blueprint*). Mantener el contraste Slate 900 sobre Slate 50 / White, bordes nítidos de 1px y tipografía tripartita (`Space Grotesk`, `Inter`, `JetBrains Mono`).
- 🚫 **No usar emojis como iconos de interfaz**: Todo glifo o indicador interactivo debe ser un SVG de `lucide-react`.
- 🚫 **No alterar la regla del 10% del naranja de seguridad**: `#f97316` es exclusivo para acciones críticas, ruta crítica y advertencias, nunca para fondos masivos decorativos.

---

## 4. Protocolo de Ejecución y Entrega
- 🚫 **Tolerancia cero a "Alucinaciones de Éxito"**: Ninguna tarea se da por completada sin haber ejecutado y validado el ciclo determinista detallado en [TESTING.md](./TESTING.md) (tests en verde, linter y build limpios).
- 🚫 **Modificaciones quirúrgicas y atómicas**: Modificar únicamente los archivos estrictamente relacionados con la tarea en curso. No refactorizar código colateral sin previo aviso.
- 💬 **Idioma y Comunicación**: Las explicaciones técnicas y respuestas al usuario deben formularse siempre en español.
