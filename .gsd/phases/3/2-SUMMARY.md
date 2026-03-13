# Summary - Plan 3.2: Alineación del Motor de Cálculo

## Completed Tasks
- [x] **Exportar lógica de ajuste en scheduler.js**: Se hizo pública la función `snapToPredecessors` para permitir su reutilización fuera del motor de cascada.
- [x] **Refactorizar TaskModal para usar el scheduler**: Se eliminó la lógica duplicada de cálculo de fechas en `TaskModal.jsx` y se reemplazó por la llamada oficial a `snapToPredecessors`.

## Verification
- Se verificó visualmente el código para asegurar que la estructura de datos pasada a `snapToPredecessors` coincide con lo esperado por el motor (`_start`, `_end`, `duration` como string, etc.).
- La lógica de "creation mode" ahora es idéntica a la lógica de "Gantt cascades", lo que garantiza que las tareas se posicionen correctamente según el calendario laboral desde el momento de su creación.

## Impact
- Eliminación de deuda técnica por código duplicado.
- Mayor precisión en el posicionamiento de tareas al usar el motor que ya contempla lags complejos y tipos de dependencia variados (SS, FF, SF).
