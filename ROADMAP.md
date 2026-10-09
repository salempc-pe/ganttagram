# ROADMAP.md — Plan de Trabajo e Historial

Este documento refleja el estado en tiempo real del progreso de **GANTTAGRAM**, dividiendo el trabajo en un checklist atómico para el sprint activo y un registro de hitos históricos y futuros.

---

## 1. Sprint Activo (Checklist de Tareas Inmediatas)

> **Nota:** Marcar con `[/]` las tareas en progreso y `[x]` las finalizadas tras pasar la verificación de [TESTING.md](./TESTING.md).

- [x] Migración al Estándar de Ingeniería de Contexto v1.1.0 (7 Pilares Operativos).
- [x] Depuración y eliminación de carpetas y artefactos duplicados (GSD y logs temporales).
- [ ] Optimización de persistencia offline local en Tauri Desktop.
- [ ] Incorporación de exportación de cronograma Gantt a formato PDF/impresión técnica.

---

## 2. Hitos y Fases Completadas (Historial)

### ✅ Fase 1: Configuración Técnica Base y Cierre de Brechas
- [x] Implementación de suite de tests unitarios con Vitest y RTL.
- [x] Consolidación de estilos CSS dispersos bajo los tokens de diseño Industrial-Tech.
- [x] Depuración de assets huérfanos y optimización de bundle inicial.

### ✅ Fase 2: Rediseño Industrial-Tech Premium
- [x] Toggle dinámico de tema Claro / Oscuro en cabecera principal (`Dashboard` y `ProjectPage`).
- [x] Header ejecutivo superior con estadísticas clave (días restantes, salud de presupuesto, cuadrillas activas).
- [x] Diferenciación visual de tareas agrupadoras (Padre) con líneas de guía vs barras de ejecución (Hijas).

### ✅ Fase 3: Robustez del Sistema de Dependencias y Scheduler
- [x] Detección de ciclos de dependencia mediante DFS (`detectCycle`) antes de persistir en Firestore.
- [x] Unificación del motor de scheduling en `TaskModal` y manipulación interactiva de Gantt.
- [x] Optimización del bucle de estabilidad y convergencia en `useTasks`.

### ✅ Fase 4: Refinamiento de Accesibilidad y Contraste en Gantt
- [x] Algoritmo dinámico de contraste de etiquetas según su posición (dentro o fuera de barra de tarea).
- [x] Halo de legibilidad (`stroke`) para nitidez de texto sobre cualquier paleta de partida.

### ✅ Fase 5: Recálculo Jerárquico Recursivo
- [x] Refactorización completa de `hierarchy.js` para propagación determinista de fechas y porcentajes de avance a todos los niveles de ancestros.

### ✅ Fase 6: Experiencia Móvil de Alto Rendimiento
- [x] Ocultamiento automático de barras de navegación y filtros secundarios en scroll móvil para maximizar el área visible del gráfico Gantt.

---

## 3. Hitos Futuros (Backlog Estratégico)
1. **Hito 7: Ruta Crítica Dinámica (CPM)**: Resaltado visual en tiempo real de partidas con holgura cero mediante el acento de seguridad `#f97316`.
2. **Hito 8: Curva S y Control de Valor Ganado**: Gráfico integrado de avance físico real vs programado para reportes de supervisión de obra.
3. **Hito 9: Exportación RNE**: Descarga de partidas, metrados y cronogramas en formato Excel/CSV compatible con software de presupuestos estándar.
