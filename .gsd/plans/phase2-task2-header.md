---
phase: 2
plan: phase2-task2-header
wave: 2
---

# Feature: Executive Dashboard Header para Proyectos

## Context
Actualmente el Gantt y el Board tienen información del proyecto apretada dentro de su propio contenedor o en la lista. Se busca un Header Ejecutivo superior con el título y las estadísticas globales (como % de avance), sacándolo de la tabla del Gantt.

## Requirements
- En la visualización de un proyecto (`ProjectPage`), el título (ej: "Edificio Multifamiliar Miraflores") debe estar en un panel superior.
- Incluir métricas: Progreso de Gantt (calculado), Días restantes (deadline), Presupuesto o Trabajadores (si aplican con resources).
- Remover la sección redundante en `GanttChart` o adaptarlo y hacerlo un componente limpio sin dependencias de titulación propia, dándole un look industrial superior.

## Tasks

<task type="auto">
  <name>Build Executive Header Component</name>
  <files>src/features/projects/pages/ProjectPage.jsx, src/features/projects/components/ProjectHeader.jsx</files>
  <action>Crear `ProjectHeader` con un layout en grid limpio, donde destacará un progreso horizontal estilizado ("Blueprint Blue") y stats minimalistas.</action>
  <done>El header se ve en la parte superior antes de renderizar el Gantt o Dashboard.</done>
</task>

<task type="auto">
  <name>Remove Redundant UI from Gantt</name>
  <files>src/features/gantt/components/GanttChart.jsx</files>
  <action>Eliminar barras superiores donde se encontraba el título antiguo, para dar 100% espacio a la grilla y tareas jerárquicas.</action>
  <done>El Gantt inicia directamente con la cabecera de la tabla (columnas de fecha) sin titulo general estorbando.</done>
</task>
