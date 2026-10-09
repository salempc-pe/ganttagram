---
target: src/features/dashboard/DashboardPage.jsx
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
created_at: 2026-08-13T09:53:10-05:00
---

# Informe de Evaluación UX/UI: Crítica del Tablero Principal

Method: dual-agent (A: cabdd504-cc45-4557-a860-96f28f793358 · B: 704d314f-3c48-40f9-9de7-c29f2e7e68fe)

## Design Health Score

| # | Heurística | Puntaje | Incidencia Principal |
|---|-----------|---------|----------------------|
| 1 | Visibilidad del estado del sistema | 2.5/4 | Métricas globales comentadas; sin indicador de sync Firebase/Tauri |
| 2 | Coincidencia con el mundo real | 3.0/4 | Buena terminología RNE; degradada por emojis informales (🏗️) |
| 3 | Control y libertad del usuario | 2.0/4 | Sin Undo/Redo en eliminación; menú móvil no cierra con Escape |
| 4 | Consistencia y estándares | 2.0/4 | Inconsistencia entre DESIGN.md e index.css (IBM Plex Sans vs Space Grotesk) |
| 5 | Prevención de errores | 1.5/4 | Uso de confirm() nativo sin doble confirmación blueprint ni debouncing |
| 6 | Reconocimiento antes que recordar | 3.0/4 | Búsqueda dinámica y código de proyecto visible |
| 7 | Flexibilidad y eficiencia de uso | 2.0/4 | Sin atajos de teclado (/) ni filtros masivos por estado |
| 8 | Estética y diseño minimalista | 2.5/4 | Buen contraste de 1px, pero vacío central por tarjetas métricas comentadas |
| 9 | Diagnóstico y recuperación de errores | 1.5/4 | Error global sólo ofrece window.location.reload() |
| 10 | Ayuda y documentación | 1.0/4 | Sin tooltips contextuales ni explicación de alertas críticas |
| **Total** | | **21/40** | **Aceptable (Requiere mejoras significativas)** |

## Design Specificity Verdict

**LLM Assessment:** La implementación actual se ha desviado del concepto *Technical Blueprint Instrument* hacia un panel corporativo genérico debido al uso de fuentes incorrectas (`IBM Plex Sans` en lugar de `Space Grotesk`), color primario desalineado (`#2a3038` en lugar de `Blueprint Blue #2563eb`), emojis informales en tarjetas de proyecto y cuadros de diálogo nativos del navegador (`alert`/`confirm`).

**Deterministic Code Scan:** Se detectaron múltiples bloques de estilos inline redundantes (`style={{ paddingLeft... }}`), invocación duplicada del hook `useProjects()`, falta de etiquetas ARIA en botones de icono, vulnerabilidad en `project.id.substring(0,4)` y violaciones de la regla *The Boundary over Shadow Rule* (bordes de 4px laterales e imperceptibilidad por opacidad reducida `opacity: 0.3`).

## Overall Impression

El Tablero Principal posee una estructura base sólida con buena separación de 1px y menú adaptativo móvil, pero la ausencia del panel de KPIs de métricas (código comentado) y las desviaciones cromáticas/tipográficas le restan el carácter de un instrumento de ingeniería de precisión.

## What's Working
1. **Separación Limpia de Contenedores:** Respeto del plano tonal con bordes finos `#e2e8f0` entre módulos.
2. **Estructura Móvil Adaptativa:** `MobileHeader` e integración de cajón de menú responsivo para trabajo en caseta de obra.

## Priority Issues

- **[P0] Tarjetas de Métricas Comentadas:** `<div className="metrics-grid">` está desactivado en `DashboardPage.jsx` (L112).
- **[P1] Desalineación Tipográfica y Cromática:** `--font-title` configurado como `IBM Plex Sans` e `--primary-color` apuntando a grafito `#2a3038` en lugar de `Space Grotesk` y `#2563eb`.
- **[P1] Diálogos Nativos Bloqueantes:** Uso de `alert()` y `confirm()` en `ProjectCard.jsx` y `ProjectList.jsx`.
- **[P2] Accesibilidad y Teclado Deficientes:** Botones sin `aria-label`, `<div onClick>` sin soporte de teclado, fuentes < 12px y opacidad reducida en reposo.
- **[P2] Estilos Inline Masivos y Código Muerto:** Atributos inline redundantes en `ProjectList.jsx` y comentarios residuales.
- **[P3] Ausencia de Paginación / Virtualización:** Sin soporte para grandes listas de proyectos de obra.

## Persona Red Flags

- **Alex (Power User / Ingeniero Residente):** No encuentra métricas clave de avance físico global. Sin filtros por estado de obra.
- **Jordan (Primerizo):** Emojis informales restan seriedad; sin tooltips aclaratorios sobre códigos RNE.
- **Sam (Accesibilidad / Inspección Térmica):** Botones invisibles en reposo por opacidad 0.3; inaccesible por teclado.
