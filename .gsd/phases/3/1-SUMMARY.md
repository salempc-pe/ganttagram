# Summary - Plan 3.1: Motor de Detección de Ciclos

## Completed Tasks
- [x] **Crear utilidad de detección de ciclos**: Implementada en `src/features/tasks/utils/cycles.js` usando un algoritmo DFS.
- [x] **Integrar validación en TaskModal**: Se añadió la comprobación de ciclos en `handleAddDep` tanto para tareas existentes como para nuevas tareas en creación.

## Verification
- Se ejecutó un script de prueba `tmp/test-cycles.js` que confirmó el correcto funcionamiento del algoritmo para casos de ciclo directo, indirecto y autoreferencia.
- El código de `TaskModal.jsx` ahora bloquea la acción de añadir dependencia con un `alert` si se detecta un ciclo.

## Impact
- Se previene la corrupción de datos y bucles infinitos en el motor de cálculo al evitar la entrada de dependencias circulares en la base de datos.
