---
phase: 3
plan: 1
wave: 1
---

# Plan 3.1: Motor de Detección de Ciclos

## Objective
Implementar una utilidad robusta para detectar dependencias circulares y prevenir su creación desde la interfaz de usuario.

## Context
- .gsd/SPEC.md
- src/features/tasks/utils/scheduler.js
- src/features/projects/components/TaskModal.jsx

## Tasks

<task type="auto">
  <name>Crear utilidad de detección de ciclos</name>
  <files>
    - src/features/tasks/utils/cycles.js
  </files>
  <action>
    - Implementar la función `hasCycle(taskId, potentialPredecessorId, dependencies)` que use DFS para verificar si añadir una dependencia crearía un ciclo.
    - Exportar funciones de ayuda para validar listas completas de dependencias.
  </action>
  <verify>Crear un script de prueba en /tmp/test-cycles.js para validar casos con ciclos y sin ciclos.</verify>
  <done>La utilidad retorna `true` cuando se detecta un ciclo (ej. A->B, B->C, intentar C->A).</done>
</task>

<task type="auto">
  <name>Integrar validación en TaskModal</name>
  <files>
    - src/features/projects/components/TaskModal.jsx
  </files>
  <action>
    - Importar `hasCycle` de la nueva utilidad.
    - En `handleAddDep`, verificar ciclos antes de proceder.
    - Mostrar un `alert` amigable si se detecta un ciclo.
  </action>
  <verify>Intentar añadir una dependencia circular en el modal y confirmar que se bloquea con un aviso.</verify>
  <done>El usuario no puede añadir dependencias circulares ni en modo edición ni en modo creación.</done>
</task>

## Success Criteria
- [ ] La utilidad DFS funciona correctamente para cualquier profundidad.
- [ ] No se pueden guardar dependencias circulares en Firestore a través del modal.
