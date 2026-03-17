---
phase: 6
plan: 1
wave: 1
---

# Plan 6.1: Rediseño de Visualización Móvil (Scroll y Ocultamiento)

## Objective
Optimizar el espacio del Gantt en dispositivos móviles. Al hacer scroll vertical, esconder elementos que restan espacio (cabecera, botones de vistas y botones de agregar tareas/hitos) dependiendo de la orientación de la pantalla (Vertical/Portrait vs Horizontal/Landscape), dejando siempre a la vista los títulos (Partida / Tarea) y fechas del Gantt.

## Context
- `src/features/gantt/components/GanttChart.jsx`
- `src/features/projects/pages/ProjectPage.jsx`
- `src/features/projects/pages/ProjectPage.css`

## Tasks

<task type="auto">
  <name>Detectar scroll en el Gantt y notificar a ProjectPage</name>
  <files>src/features/gantt/components/GanttChart.jsx, src/features/projects/pages/ProjectPage.jsx</files>
  <action>
    - En `GanttChart.jsx`, agregar un prop opcional `onScrollStateChange`.
    - Crear un `handleScroll` en el div `.gantt-scroll-container` que evalúe si el `scrollTop` es mayor a 20px o 30px (y si está arrastrando hacia abajo o si simplemente pasó el umbral). Debounce o throttle es recomendable para performance (opcional pero útil).
    - Notificar mediante `onScrollStateChange(true)` al bajar, y `false` al volver arriba (`scrollTop <= 10`).
    - En `ProjectPage.jsx`, crear un estado local `[isScrolled, setIsScrolled] = useState(false)` y pasarlo a `GanttChart`.
    - En `ProjectPage.jsx`, agregar la clase dinámica `is-scrolled` al contenedor principal (ej: `project-layout` o `project-content`) cuando `isScrolled` sea true.
  </action>
  <verify>Verificar que el estado `isScrolled` se activa en `ProjectPage` al hacer scroll vertical en el diagrama de Gantt.</verify>
  <done>El estado true/false se propaga correctamente del Gantt hacia el layout padre basado en el scroll local del SVG/Grid.</done>
</task>

<task type="auto">
  <name>Aplicar reglas CSS según orientación para ocultamiento dinámico</name>
  <files>src/features/projects/pages/ProjectPage.css, src/features/projects/pages/ProjectPage.jsx</files>
  <action>
    - Para asegurar animaciones suaves, modifique los componentes en `ProjectPage.jsx` (como `<MobileHeader>` y `<div className="mobile-view-controls">`) para que no colapsen abruptamente sino que se puedan transicionar en alto y margen. O bien, modifique su CSS para usar `transform: translateY(-100%)` o `max-height` / `margin` si prefieres transiciones fluidas.
    - En `ProjectPage.css` (o mediante clases directas), añadir media queries:
      - `@media (max-width: 767px) and (orientation: portrait)`:
        - Si existe `.is-scrolled`, ocultar la barra `.mobile-view-controls` (donde están botones de vistas, hitos y tareas).
      - `@media (max-width: 850px) and (orientation: landscape)` (y móviles en apaisado en general):
        - Si existe `.is-scrolled`, ocultar `.mobile-view-controls`, el `MobileHeader` (cabecera superior) y si existe, el `ProjectHeader`. 
        - Asegurar que al estar ocultos, el espacio se dedique completamente al `.project-content` y por ende, al `GanttChart`.
    - Cuidar que al quitar los elementos de la vista, el gráfico amplíe su altura y la fila de "Partida/Tarea" `CustomTaskListHeader` siga siendo visible y sirva como ancla del diagrama.
  </action>
  <verify>Cambiar de orientación en navegador/emulador, hacer scroll y comprobar que cabeceras/controles desaparecen correctamente.</verify>
  <done>Ganancia de espacio máxima para el Gantt (se deben ver las filas casi a pantalla completa) dependiendo de la orientación.</done>
</task>

## Success Criteria
- [ ] En móvil vertical, al hacer scroll, `.mobile-view-controls` desaparece suavemente (o instantáneamente sin romper el viewport).
- [ ] En móvil horizontal, al hacer scroll desaparecen la cabecera completa y `.mobile-view-controls`.
- [ ] Al subir (`scrollTop` cerca a 0), reaparecen los controles.
- [ ] Las columnas "Partida / Tarea" y fechas no se ocultan jamás durante el scroll.
