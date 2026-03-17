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
**Status**: ✅ Completed
**Objective**: Resolver inconsistencias en el cálculo de fechas, implementar detección de ciclos y optimizar el motor de estabilidad.

**Tasks**:
- [ ] Implementar detector de dependencias circulares antes de la persistencia en Firebase.
- [ ] Alineación de lógica: Asegurar que `TaskModal` use el mismo motor `scheduler.js` para cálculos de creación.
- [ ] Optimizar el bucle de estabilidad en `useTasks` y mejorar el manejo de errores en fallos de convergencia.

**Verification**:
- Pruebas unitarias de detección de ciclos.
- Verificación manual de consistencia de fechas en proyectos con >4 niveles de profundidad.

### Phase 4: Refinamiento de Accesibilidad y UI del Gantt
**Status**: ✅ Complete
**Objective**: Optimizar la legibilidad de las etiquetas en el Gantt mediante contraste dinámico contextual.

**Tasks**:
- [x] Implementar detección de posición (dentro/fuera de barra) para etiquetas de tareas.
- [x] Ajustar colores de texto según luminancia de barra (dentro) o tema global (fuera).
- [x] Refinar halo de legibilidad (`stroke`) para coherencia visual en todos los estados.

**Verification**:
- Etiquetas legibles en barras claras y oscuras.
- Etiquetas legibles fuera de barras en modo claro y oscuro.
- No hay parpadeos ni retrasos notables al desplazar el Gantt.

### Phase 5: Deuda Técnica
**Status**: ✅ Complete
**Objective**: Resolver la deuda técnica encontrada durante la inspección del código base (/map), específicamente el recálculo recursivo de todos los ancestros de una tarea en hierarchy.js.
**Depends on**: Phase 4

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
**Status**: ✅ Completed
**Objective**: Resolver inconsistencias en el cálculo de fechas, implementar detección de ciclos y optimizar el motor de estabilidad.

**Tasks**:
- [ ] Implementar detector de dependencias circulares antes de la persistencia en Firebase.
- [ ] Alineación de lógica: Asegurar que `TaskModal` use el mismo motor `scheduler.js` para cálculos de creación.
- [ ] Optimizar el bucle de estabilidad en `useTasks` y mejorar el manejo de errores en fallos de convergencia.

**Verification**:
- Pruebas unitarias de detección de ciclos.
- Verificación manual de consistencia de fechas en proyectos con >4 niveles de profundidad.

### Phase 4: Refinamiento de Accesibilidad y UI del Gantt
**Status**: ✅ Complete
**Objective**: Optimizar la legibilidad de las etiquetas en el Gantt mediante contraste dinámico contextual.

**Tasks**:
- [x] Implementar detección de posición (dentro/fuera de barra) para etiquetas de tareas.
- [x] Ajustar colores de texto según luminancia de barra (dentro) o tema global (fuera).
- [x] Refinar halo de legibilidad (`stroke`) para coherencia visual en todos los estados.

**Verification**:
- Etiquetas legibles en barras claras y oscuras.
- Etiquetas legibles fuera de barras en modo claro y oscuro.
- No hay parpadeos ni retrasos notables al desplazar el Gantt.

### Phase 5: Deuda Técnica
**Status**: ✅ Complete
**Objective**: Resolver la deuda técnica encontrada durante la inspección del código base (/map), específicamente el recálculo recursivo de todos los ancestros de una tarea en hierarchy.js.
**Depends on**: Phase 4

**Tasks**:
- [x] Plan 5.1: Refactor Hierarchy Recalculation

**Verification**:
- [x] VERIFICATION.md (PASS)

### Phase 6: Rediseño de Visualización Móvil
**Status**: ✅ Complete
**Objective**: Optimizar el espacio del Gantt en móviles. Al desplazar verticalmente u horizontalmente, ocultar la cabecera y los botones (hitos, días), manteniendo visible solo la fila de títulos de tareas y fechas para maximizar el área de visualización del Gantt.
**Depends on**: Phase 5

**Tasks**:
- [x] Plan 6.1: Rediseño de Visualización Móvil (Scroll y Ocultamiento)

**Verification**:
- [x] VERIFICATION.md (PASS)
