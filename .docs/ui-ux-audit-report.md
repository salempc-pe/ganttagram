# 🎨 Auditoría UI/UX — GANTTAGRAM
**Skills:** `ui-ux-designer` + `ui-ux-pro-max`  
**Fecha:** 12/02/2026  
**Método:** Revisión de CSS + capturas de pantalla (Desktop + Mobile)

---

## RESUMEN EJECUTIVO

| Categoría | Estado | Issues |
|-----------|--------|--------|
| Espaciado y Padding | ⚠️ Mejorable | 5 |
| Tipografía | ✅ Bien | 1 |
| Alineaciones | ⚠️ Mejorable | 3 |
| Balance Gráfico | ✅ Bien | 1 |
| Touch Targets | ✅ Bien | 1 |
| Contraste | ✅ Bien | 0 |
| Consistencia | ⚠️ Mejorable | 3 |
| Responsive | ✅ Bien | 2 |
| Estados Interactivos | ✅ Bien | 0 |
| Iconografía | ⚠️ Mejorable | 1 |

**Total issues: 17** (4 altos, 8 medios, 5 bajos)

---

## ISSUES IDENTIFICADOS

### 🔴 ALTO — Afectan la experiencia directamente

#### A1. `App.css` conflicto con `index.css` — `#root` duplicado
- **Archivo:** `App.css` línea 1-6
- **Problema:** `App.css` define `#root { max-width: 1280px; text-align: center; padding: 2rem }` que es el boilerplate de Vite y ENTRA EN CONFLICTO con el layout real de la app. Esto está limitando el ancho máximo a 1280px y centrando todo con padding de 2rem que compite con el layout propio.
- **Impacto:** El contenido del dashboard podría estar innecesariamente limitado/centrado
- **Fix:** Eliminar o vaciar `App.css` completamente — es boilerplate de Vite no usado

#### A2. Mobile: `card-action-btn` < 44px en TaskList  
- **Archivo:** `TaskList.css` línea 226-229
- **Problema:** En móvil, `card-action-btn` se reduce a 32×32px, por debajo del mínimo de 44px de touch target (WCAG / Apple HIG)
- **Impacto:** Difícil de tocar en móvil, especialmente los botones de editar/eliminar
- **Fix:** Mantener 40px mínimo en mobile

#### A3. Dashboard: Espaciado inconsistente entre secciones
- **Archivo:** `DashboardPage.css`
- **Problema:** `metrics-grid` usa `gap: var(--space-xl)` (2.5rem) y `dashboard-grid` también usa `gap: var(--space-xl)`, pero en mobile el primero baja a `var(--space-md)` (1rem) y el segundo a `var(--space-lg)` (1.5rem) — inconsistente
- **Impacto:** Sensación visual de escalas diferentes entre secciones
- **Fix:** Unificar gaps en mobile: ambos a `var(--space-md)`

#### A4. TaskModal: Fechas stacking vertical pierde coherencia visual en mobile
- **Archivo:** `TaskModal.css` línea 474-480
- **Problema:** `.form-row-dates` se fuerza a `flex-direction: column` en mobile (línea 477), pero el contenedor visual que envuelve INICIO—DÍAS—FIN tiene un fondo `#f1f5f9` y padding `2px` diseñado para una fila horizontal. Al stackear verticalmente, el diseño "panel de instrumentos" se pierde
- **Fix:** Mantener la fila horizontal en mobile (ya que los 3 campos caben) o rediseñar el layout vertical con separadores visuales

---

### 🟡 MEDIO — Mejoras de polish visual

#### M1. ProjectMembers: Emoji 👑 usado como icono de UI
- **Archivo:** `ProjectMembers.jsx`
- **Problema:** Se usa `👑` para el rol "Propietario" y `⏳` para "Pendiente". Según las guidelines de `ui-ux-pro-max`: "Use SVG icons (Heroicons, Lucide), not emojis as UI icons"
- **Fix:** Reemplazar con iconos de Lucide: `<Crown>` para owner, `<Clock>` para pendiente

#### M2. ProjectSidebar colapsado: tooltips usan z-index 1000
- **Archivo:** `ProjectSidebar.css` línea 168
- **Problema:** Los tooltips de la sidebar usan `z-index: 1000` que puede conflictuar con modales (z-index: 9999/10000). No es crítico, pero el sistema de z-index no está ordenado
- **Fix:** Definir escala clara: tooltips=50, sidebar=100, modals=9999

#### M3. ProjectCard hover: translateY desplaza layout
- **Archivo:** `TaskList.css` línea 42-46
- **Problema:** `task-card:hover` usa `transform: translateY(-2px)` que puede causar layout shift sutil cuando hay muchas cards seguidas
- **Fix:** Usar solo `box-shadow` para el efecto hover, sin transform. O usar `translateY(-1px)` más sutil

#### M4. `metric-label` font-size demasiado pequeño: 0.65rem ≈ 10.4px
- **Archivo:** `DashboardPage.css` línea 87
- **Problema:** 10.4px está por debajo del mínimo recomendado de 12px para texto legible
- **Fix:** Subir a `0.75rem` (12px) mínimo

#### M5. `.dep-label` font-size = 10px — demasiado pequeño
- **Archivo:** `TaskModal.css` línea 299
- **Problema:** 10px es difícil de leer, especialmente en mobile
- **Fix:** Subir a 11px mínimo

#### M6. Sidebar collapsed width (76px) vs main sidebar (72px)
- **Archivo:** `ProjectSidebar.css` línea 2 vs `index.css` línea 471
- **Problema:** La sidebar del app tiene 72px pero la project sidebar tiene 76px. Esta diferencia de 4px es visible cuando se navega entre dashboard y proyecto
- **Fix:** Unificar a 72px o 76px

#### M7. `form-row-dates` gap de 2px demasiado cerrado
- **Archivo:** `TaskModal.css` línea 118
- **Problema:** Los campos de fecha están separados por solo 2px, dificultando distinguir visualmente dónde termina un campo y empieza otro
- **Fix:** Aumentar a 4px o agregar un borde divisor sutil

#### M8. Dashboard cards con `border-radius: var(--radius-sm)` (4px) vs TaskList con `var(--radius-lg)` (8px)
- **Archivo:** `DashboardPage.css` vs `TaskList.css`
- **Problema:** Inconsistencia en border-radius entre componentes similares (cards)
- **Fix:** Unificar a `var(--radius-md)` (6px) o `var(--radius-lg)` (8px) para todas las cards

---

### 🟢 BAJO — Detalles de perfeccionamiento

#### B1. `line-height: 1.1` en headings puede cortar descenders
- **Archivo:** `index.css` línea 137
- **Problema:** `line-height: 1.1` es muy ajustado para headings, especialmente con letras como "g", "p", "y"
- **Fix:** Subir a `1.2` para headings

#### B2. `.project-tag` padding asimétrico (2px 6px)
- **Archivo:** `DashboardPage.css` línea 220
- **Problema:** El padding vertical de 2px es muy pequeño comparado con el horizontal de 6px
- **Fix:** Usar `3px 8px` para mejor balance

#### B3. `modal-overlay` z-index 9999 excesivo
- **Archivo:** `index.css` línea 594
- **Problema:** z-index de 9999 es arbitrario y alto. Mejor usar una escala definida
- **Fix:** Usar 1000 o establecer escala clara

#### B4. `btn-nav-back` font-size 10px
- **Archivo:** `index.css` línea 630
- **Problema:** 10px es bastante pequeño para un botón de navegación
- **Fix:** Subir a 11px

#### B5. Doble definición de utilities (.flex, .gap-*, etc.)
- **Archivo:** `index.css` — duplicadas en líneas 213-239 y 364-406
- **Problema:** Las mismas utilidades están definidas dos veces, la segunda con `!important`
- **Fix:** Consolidar en una sola definición

---

## ✅ LO QUE ESTÁ BIEN

1. **Design System completo** — Tokens bien definidos (colores, espaciado, tipografía, sombras)
2. **Tipografía premium** — 3 fuentes (Inter, Space Grotesk, JetBrains Mono) bien usadas
3. **body line-height: 1.6** — Cumple la recomendación de 1.5-1.75 ✅
4. **Touch targets base: 44px** — La media query para touch devices está implementada correctamente ✅
5. **Contraste de texto** — `text-primary: #0f172a` sobre `bg-primary: #f8fafc` = ratio >12:1 ✅  
6. **Grid pattern background** — Detalle visual que da identidad "blueprint" única
7. **Animaciones** — Duración 150-300ms con cubic-bezier apropiado ✅
8. **Hover states** — Todos los elementos interactivos tienen feedback visual ✅
9. **Focus states** — Select/inputs tienen box-shadow de focus ✅
10. **Modal animation** — slide-up con timing curve premium ✅

---

## PLAN DE FIXES RECOMENDADO

### Prioridad 1 (Críticos) — ✅ COMPLETADO
- [x] A1: Limpiar `App.css` (boilerplate Vite)
- [x] A2: Touch targets mínimo 40px en mobile
- [x] A3: Unificar gaps mobile
- [x] A4: Mantener row horizontal de fechas en mobile

### Prioridad 2 (Polish) — ✅ COMPLETADO
- [x] M1: Reemplazar emojis por iconos Lucide (Crown, Pencil, Eye, Clock, Mail, etc.)
- [x] M4: Subir metric-label de 0.65rem a 0.75rem
- [x] M5: Subir dep-label de 10px a 11px
- [x] M6: Unificar ancho de sidebars a 72px
- [x] M8: Unificar border-radius de cards a var(--radius-md)

### Prioridad 3 (Detalle) — ✅ COMPLETADO
- [x] B1: Heading line-height 1.1 → 1.2
- [x] B2: project-tag padding 2px 6px → 3px 8px
- [x] B4: btn-nav-back font-size 10px → 11px
- [x] B5: Consolidar utilities duplicadas (eliminado bloque duplicado)
- [x] M2: Tooltip z-index 1000 → 200
- [x] M3: Hover translateY -2px → -1px
- [x] M7: form-row-dates gap 2px → 4px
