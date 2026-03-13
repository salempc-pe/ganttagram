# Project Roadmap

### Phase 1: Gap Closure
**Status**: ✅ Completed
**Objective**: Address gaps from milestone audit (Initial Technical Setup & Fixes)

**Gaps to Close:**
- [x] Implement tests for complex UI or critical flows (Testing Coverage).
- [x] Consolidate scattered CSS styles under Industrial-Tech Premium baseline.
- [x] Clean up unused assets (`ejemplo.webp`).

### Phase 2: Industrial-Tech Premium Redesign
**Status**: ✅ Completed
**Objective**: Implement new premium visual hierarchy and Gantt interactions.

**Tasks:**
- [x] Implementar Toggle de Theme Claro/Oscuro en la cabecera general (`Dashboard` y `ProjectPage`).
- [x] Mover Título y Progreso Global del layout interno del Gantt a un Header superior tipo Dashboard Ejecutivo (stats de días, presupuesto, trabajadores).
- [x] Cambiar renderizado visual de "Tareas Padre" en el Gantt (líneas delgadas) vs "Tareas Hija" (barras normales).

### Phase 3: Robustez del Sistema de Dependencias
**Status**: ⬜ Not Started
**Objective**: Resolver inconsistencias en el cálculo de fechas, implementar detección de ciclos y optimizar el motor de estabilidad.

**Tasks**:
- [ ] Implementar detector de dependencias circulares antes de la persistencia en Firebase.
- [ ] Alineación de lógica: Asegurar que `TaskModal` use el mismo motor `scheduler.js` para cálculos de creación.
- [ ] Optimizar el bucle de estabilidad en `useTasks` y mejorar el manejo de errores en fallos de convergencia.

**Verification**:
- Pruebas unitarias de detección de ciclos.
- Verificación manual de consistencia de fechas en proyectos con >4 niveles de profundidad.
