# TESTING.md — Comandos de Verificación Determinista

Este archivo establece los comandos exactos y el protocolo automatizado de verificación que todo agente de IA o desarrollador **debe ejecutar obligatoriamente** tras implementar cualquier cambio en **GANTTAGRAM**.

> **Regla de Oro:** "Un agente no falla por falta de capacidad técnica; falla cuando el contexto carece de límites negativos claros y cuando no cuenta con herramientas automáticas para verificar su propio trabajo."

---

## 1. Comandos Exactos de Validación

### A. Pruebas Unitarias y de Integración (Vitest)
Ejecuta la suite completa de tests en modo de ejecución única (*single-run*):
```bash
npm run test -- --run
```
- **Criterio de éxito**: 100% de archivos y suites de test en verde (`passed`), sin excepciones no capturadas.

### B. Análisis Estático de Código (ESLint)
Valida que no existan errores de sintaxis, imports rotos ni violaciones de reglas de Hooks:
```bash
npm run lint
```
- **Criterio de éxito**: Salida limpia con código de salida `0` y 0 errores.

### C. Compilación para Producción (Vite Build)
Valida que el empaquetado, resolución de módulos, generación de chunks y service workers PWA se generen sin fallas:
```bash
npm run build
```
- **Criterio de éxito**: Creación exitosa de artefactos en `dist/` sin advertencias críticas de Rollup.

### D. Verificación Integral en una Sola Línea
Para ejecutar todo el ciclo en una única instrucción determinista:
```bash
npm run test -- --run && npm run build
```

---

## 2. Protocolo de 5 Pasos al Iniciar y Finalizar una Tarea

1. **Paso 1: Leer el contexto base y las restricciones**
   - Consultar `RULES.md` y `PROJECT.md` (y `DESIGN.md` si involucra componentes de interfaz).
2. **Paso 2: Sincronizar el plan inmediato**
   - Inspeccionar `ROADMAP.md`, seleccionar la tarea atómica pendiente y marcarla en progreso.
3. **Paso 3: Planificar antes de codificar**
   - Investigar los archivos existentes y estructurar los cambios antes de modificaciones masivas.
4. **Paso 4: Ejecutar cambios quirúrgicos y atómicos**
   - Modificar únicamente los archivos asociados a la tarea activa. No alterar código ajeno ni añadir dependencias innecesarias.
5. **Paso 5: Ejecutar el ciclo de verificación determinista**
   - Correr las comprobaciones de este archivo (`TESTING.md`). No dar por finalizada la tarea hasta que todas pasen en verde.
