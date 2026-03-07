---
phase: 2
plan: phase2-task1-theme
wave: 1
---

# Feature: Theme Toggle (Light/Dark Mode)

## Context
El usuario requiere alternar el estilo "Industrial-Tech Premium" entre modo claro y el nuevo modo oscuro ("Deep Slate").

## Requirements
- Modificar el layout global (ej: `App.jsx`, `index.css`) o usar un contexto (`ThemeProvider`) para almacenar la variable de preferncia dark/light.
- Agregar un toggle (ícono Sol/Luna) en el Header General (MobileHeader y desktop header/Sidebar).
- Definir las variables CSS necesarias (`--bg-primary`, `--text-primary`, etc.) en un bloque `:root[data-theme='dark']`.

## Tasks

<task type="auto">
  <name>Setup Dark Theme CSS Variables</name>
  <files>src/index.css</files>
  <action>Añadir `:root[data-theme="dark"]` con colores slate profundos (`#0f172a`, `#1e293b`), invirtiendo los contrastes globales.</action>
  <done>Las variables de CSS soportan el data-theme dark.</done>
</task>

<task type="auto">
  <name>Implement ThemeContext & Toggle Button</name>
  <files>src/shared/context/ThemeContext.jsx, src/App.jsx, src/features/projects/components/ProjectSidebar.jsx</files>
  <action>Crear provieder, inicializar estado local storage, e incluir el botón toggle en la UI principal.</action>
  <done>El usuario puede hacer click en el toggle y el fondo cambia al modo oscuro fluidamente.</done>
</task>
