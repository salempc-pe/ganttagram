# ADR-0003: Motor de Dependencias ASAP y Detección de Ciclos

**Fecha:** 15/03/2026  
**Estado:** Aprobado / Implementado  
**Contexto:** La planificación de obras de construcción requiere que las fechas de tareas sucesoras dependan estrictamente de sus predecesoras (regla ASAP - As Soon As Possible). La posibilidad de ciclos circulares bloqueaba los bucles de cálculo en el hook `useTasks` y causaba inconsistencias entre la UI de `TaskModal` y el visor del Gantt.

---

## Decisión

1. **Detección de dependencias circulares**: Algoritmo DFS `detectCycle()` ejecutado antes de la persistencia en Firestore y en la selección de dependencias en `TaskModal`.
2. **Unificación del motor de scheduling**: Tanto la creación de tareas desde modal como los cambios interactivos de arrastre en el gráfico Gantt emplean el motor único centralizado en `src/features/tasks/utils/scheduler.js`.
3. **Cálculo recursivo de jerarquía**: Implementación de recálculo determinista en cascada en `src/features/tasks/utils/hierarchy.js` para propagar fechas y avances desde partidas hijas hacia partidas resumen o padre.
4. **Límite de iteraciones en bucle de estabilidad**: Guardrail defensivo en `useTasks` para abortar de forma segura si una combinación de relaciones no converge.

---

## Consecuencias

- Integridad total de cronogramas y prevención absoluta de bloqueos por bucles infinitos en el cliente.
