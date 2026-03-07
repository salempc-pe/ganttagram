---
phase: 2
plan: phase2-task3-gantt-parents
wave: 2
---

# Feature: Representación visual jerárquica en Gantt (Padres)

## Context
Se usa actualmente el mismo rectángulo grueso para las "carpetas/fases" y las "tareas hijas" en el bloque iterativo visual de `gantt-task-react` o el diagrama custom que tengamos. Se pretende diferenciar las tareas padre con simples líneas delgadas o corchetes que envuelvan la duración total.

## Requirements
- Modificar el render de la barra en `GanttChart.jsx` si la dependencia y anidación define a una tarea como `type === 'project'` (padre).
- Darle un estilo de línea fina (`height: 2px` o similar) con topes laterales (estilo corchete `[      ]`).

## Tasks

<task type="auto">
  <name>Update Gantt Bar Render logic</name>
  <files>src/features/gantt/components/GanttChart.jsx, src/features/gantt/components/GanttChart.css</files>
  <action>Comprobar la inyección de `CustomTask` o el estilo CSS que modifica solo a los elements type='project'. Asignarle una clase de corchete vacío con bordes laterales y top-line fina.</action>
  <done>En la gráfica, las carpetas (ítems padres o summary) no son rectangulos gruesos rellenos, sino líneas superiores huecas o delgadas marcando solo duraciones netas.</done>
</task>
