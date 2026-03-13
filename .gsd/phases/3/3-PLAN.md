---
phase: 3
plan: 3
wave: 2
---

# Plan 3.3: Estabilidad y Atomicidad de Datos

## Objective
Optimizar el motor de persistencia para que los cambios masivos sean atómicos y mejorar la resiliencia del bucle de estabilidad.

## Context
- src/features/tasks/hooks/useTasks.js
- src/features/tasks/utils/scheduler.js

## Tasks

<task type="auto">
  <name>Implementar Batch Updates en useTasks</name>
  <files>
    - src/features/tasks/hooks/useTasks.js
  </files>
  <action>
    - Refactorizar `resolveAndCommitScheduling` para usar `writeBatch(db)` de Firestore.
    - Agrupar todos los cambios de tareas y hitos en un único batch.
    - Asegurar que el batch solo se ejecute si no hubo errores en el bucle de estabilidad.
  </action>
  <verify>Realizar un cambio que afecte a varias tareas (>10) y verificar en la consola de Firebase que se actualizan de forma sincronizada.</verify>
  <done>Se eliminó el bucle de `await updateDoc` en favor de un único `await batch.commit()`.</done>
</task>

<task type="auto">
  <name>Robustecer el bucle de estabilidad</name>
  <files>
    - src/features/tasks/hooks/useTasks.js
  </files>
  <action>
    - Aumentar el límite de iteraciones o hacerlo dinámico basándose en `tasks.length`.
    - Implementar detección de no-convergencia: si se alcanza el límite, lanzar una excepción y evitar el commit.
    - Mostrar un aviso claro al usuario si el cronograma no pudo estabilizarse.
  </action>
  <verify>Simular un caso de carga pesada y verificar que no hay "flicker" o corrupción de datos si falla el cálculo.</verify>
  <done>El sistema es "crash-proof" ante fallos imprevistos del motor de cálculo.</done>
</task>

## Success Criteria
- [ ] Todas las actualizaciones por cascada son atómicas (todo o nada).
- [ ] El límite de 30 iteraciones fue revisado y mejorado.
