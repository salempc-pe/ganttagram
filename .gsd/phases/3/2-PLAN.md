---
phase: 3
plan: 2
wave: 1
---

# Plan 3.2: Alineación del Motor de Cálculo

## Objective
Unificar la lógica de cálculo de fechas entre el modal de tareas y el motor general para garantizar consistencia (ASAP estricto).

## Context
- src/features/tasks/utils/scheduler.js
- src/features/projects/components/TaskModal.jsx

## Tasks

<task type="auto">
  <name>Exportar lógica de ajuste en scheduler.js</name>
  <files>
    - src/features/tasks/utils/scheduler.js
  </files>
  <action>
    - Exportar `snapToPredecessors` o crear una función simplificada que permita calcular la fecha de inicio más temprana para una tarea dada su lista de predecesores.
  </action>
  <verify>N/A (Refactorización interna)</verify>
  <done>La función es accesible desde otros módulos.</done>
</task>

<task type="auto">
  <name>Refactorizar TaskModal para usar el scheduler</name>
  <files>
    - src/features/projects/components/TaskModal.jsx
  </files>
  <action>
    - Reemplazar la lógica manual de `handleAddDep` (el bucle `while`) por la llamada al motor de `scheduler.js`.
    - Asegurar que al añadir una dependencia, la tarea se mueva automáticamente al punto ASAP.
  </action>
  <verify>Añadir dependencias de tipo FF o SF y verificar que el cálculo de la fecha de inicio es instantáneo y correcto según el calendario.</verify>
  <done>Código simplificado y lógica idéntica a la del diagrama de Gantt.</done>
</task>

## Success Criteria
- [ ] Se eliminó el código duplicado de cálculo de fechas en el modal.
- [ ] Las tareas creadas respetan estrictamente el calendario de días laborables.
