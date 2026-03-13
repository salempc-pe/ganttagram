# Project Specification: Ganttagram

**Status**: FINALIZED

## Overview
Ganttagram es una herramienta de gestión de proyectos basada en diagramas de Gantt con un motor de programación (scheduler) que prioriza la lógica de dependencias (ASAP estricto).

## Phase 3 Requirements: Robustez del Sistema de Dependencias

### 1. Detección de Dependencias Circulares
- **Objetivo**: Evitar que el usuario cree ciclos de dependencias (ej. Tarea A -> Tarea B -> Tarea A) que bloqueen el motor de cálculo.
- **Implementación**:
    - Crear una utilidad `detectCycle(tasks, taskId, dependencyId)` que realice una búsqueda en profundidad (DFS) para encontrar ciclos.
    - Integrar esta validación en el `TaskModal` y en cualquier lógica de actualización de dependencias antes de llamar a la persistencia.
    - Mostrar un aviso al usuario si se detecta un ciclo.

### 2. Unificación del Motor de Cálculos (Alignment)
- **Objetivo**: Garantizar que las tareas creadas desde el modal sigan las mismas reglas de posicionamiento que las editadas en el Gantt.
- **Implementación**:
    - Refactorizar `TaskModal.jsx` para que use `scheduler.js` al calcular las fechas iniciales de una nueva tarea con predecesores.
    - Eliminar discrepancias entre el "holgura positiva" permitida en el modal y el "ASAP estricto" del motor general.

### 3. Optimización del Bucle de Estabilidad
- **Objetivo**: Mejorar el rendimiento y la fiabilidad del hook `useTasks` al manejar cascadas de fechas complejas.
- **Implementación**:
    - Revisar la recursión en `useTasks.js` y `scheduler.js`.
    - Implementar un manejo de errores más claro cuando el motor no converge (alcanza el límite de iteraciones).
    - Asegurar que la persistencia en Firebase sea atómica para evitar estados inconsistentes en la nube.

## Verification Criteria
- No es posible guardar un ciclo de dependencias.
- Las tareas creadas con dependencias se posicionan exactamente igual a si se hubieran ajustado manualmente en el Gantt.
- Proyectos con alta profundidad de dependencias convergen sin errores visibles.
