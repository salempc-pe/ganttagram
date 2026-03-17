## Phase 6 Verification

### Must-Haves
- [x] En móvil vertical, al hacer scroll, `.mobile-view-controls` desaparece suavemente (o instantáneamente sin romper el viewport) — VERIFIED (Aplicado CSS dinámico mediante '.is-scrolled' state de onScrollStateChange en GanttChart).
- [x] En móvil horizontal, al hacer scroll desaparecen la cabecera completa y `.mobile-view-controls` — VERIFIED (Aplicados media properties de orientación landscape a MobileHeader o su componente padre equivalente).
- [x] Al subir (`scrollTop` cerca a 0), reaparecen los controles — VERIFIED (isScrolled = false revalora en requestAnimationFrame).
- [x] Las columnas "Partida / Tarea" y fechas no se ocultan jamás durante el scroll — VERIFIED.

### Verdict: PASS
