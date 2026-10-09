---
name: GANTTAGRAM
description: High-performance Gantt project management tool for Peruvian construction with Industrial-Tech Premium aesthetic.
colors:
  primary: "#2563eb"
  accent-safety: "#f97316"
  neutral-bg: "#f8fafc"
  surface: "#ffffff"
  text-primary: "#0f172a"
  text-secondary: "#475569"
  border: "#e2e8f0"
typography:
  display:
    fontFamily: "Space Grotesk, sans-serif"
    fontWeight: 700
  body:
    fontFamily: "Inter, sans-serif"
    fontWeight: 400
  mono:
    fontFamily: "JetBrains Mono, monospace"
    fontWeight: 500
rounded:
  sm: "6px"
  md: "8px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
---

# Design System: Industrial-Tech Premium (GANTTAGRAM)

## Overview

**Creative North Star: "The Technical Blueprint Instrument"**

GANTTAGRAM es una herramienta de gestión de proyectos de alta precisión diseñada para la industria de la construcción en Perú. El sistema visual combina la fiabilidad táctil de un plano técnico de arquitectura/ingeniería con la sofisticación de un instrumento de control digital moderno. 

La interfaz se define por su alta densidad de información sin saturación visual, basada en líneas nítidas, fondos limpios en tonos pizarra clara (Slate 50 / Blanco) y contrastes numéricos de alta legibilidad. La estética huye del minimalismo genérico de consumidor final en favor de un carácter profesional, quirúrgico y de alto rendimiento.

**Key Characteristics:**
- Estética *Technical Blueprint* clara, limpia y de alto contraste.
- Jerarquía tipográfica tripartita (Space Grotesk para encabezados, Inter para cuerpo, JetBrains Mono para datos y metrados).
- Densidad compacta ideada para monitoreo simultáneo de cronogramas Gantt y uso eficiente del espacio en pantalla.
- Acentos funcionales de seguridad e interactividad (*Construction Orange* `#f97316` y *Blueprint Blue* `#2563eb`).

## Colors

La paleta cromática imita la claridad de un plano de ingeniería en limpio con acentos de señalización táctica.

### Primary
- **Blueprint Blue** (`#2563eb`): Elementos de interacción principal, barras de avance en Gantt y estados activos.

### Secondary
- **Construction Orange (Safety Accent)** (`#f97316`): Acciones críticas, alertas de desvío en ruta crítica, botones primarios y resaltados de seguridad.

### Neutral
- **Background Slate** (`#f8fafc`): Fondo general de trabajo, limpio y antideslumbrante.
- **Surface White** (`#ffffff`): Fondo para tarjetas, paneles laterales y modales de tarea.
- **Primary Text Dark** (`#0f172a`): Texto de alto contraste para nombres de partidas, metrados y valores clave.
- **Secondary Text Slate** (`#475569`): Etiquetas, metadatos y descripciones secundarias.
- **Crisp Border** (`#e2e8f0`): Divisores de tabla y contornos de cuadrícula técnica.

### Named Rules
**The Blueprint Accent Rule.** El color azul (`#2563eb`) representa estado interactivo y avance normal. El naranja de seguridad (`#f97316`) se reserva para acciones de ejecución directa, hitos críticos o desvíos que exigen atención inmediata del residente de obra.

## Typography

**Display Font:** `Space Grotesk` (sans-serif con estructura geométrica/monotécnica)  
**Body Font:** `Inter` (sans-serif neutra de máxima legibilidad)  
**Label/Mono Font:** `JetBrains Mono` (monospace para códigos de partida, metrados, fechas y datos numéricos)

### Hierarchy
- **Display** (Bold 700, `1.875rem` / `30px`, `line-height: 1.2`): Títulos de dashboards ejecutivos y nombres de obra principales.
- **Headline** (SemiBold 600, `1.25rem` / `20px`, `line-height: 1.3`): Cabeceras de sección, módulos de partidas y tarjetas principales.
- **Title** (Medium 500, `1rem` / `16px`, `line-height: 1.4`): Nombres de partidas en lista y filtros activos.
- **Body** (Regular 400, `0.875rem` / `14px`, `line-height: 1.5`): Textos explicativos, observaciones de obra y notas de campo.
- **Label / Mono** (Medium 500, `0.75rem` / `12px`, `letter-spacing: 0.02em`): Códigos RNE, fechas inicio/fin, metrados numéricos y porcentajes de avance.

### Named Rules
**The Numeric Precision Rule.** Todos los datos cuantitativos (fechas, duraciones, metrados, costos y códigos de partidas) se representan obligatoriamente en `JetBrains Mono` para garantizar alineación exacta y escaneo numérico sin confusión.

## Layout

- **Model Spatial:** Cuadrícula técnica de alta densidad con densidad compacta (`padding` comprimido de 8px–12px en tablas y listas).
- **Container Strategy:** Paneles divididos por bordes finos de 1px (`#e2e8f0`) en lugar de márgenes amplios.
- **Responsive Behavior:** En pantallas anchas (Desktop), panel lateral de cronograma Gantt + tabla de partidas lado a lado. En móvil/tablet, colapso dinámico a tarjetas compactas y visualización adaptada de tareas.

## Elevation & Depth

El sistema es marcadamente plano y estructurado sobre capas tonales (*flat-by-default*).

### Shadow Vocabulary
- **Surface Rest:** Sin sombra (`box-shadow: none`). La separación entre módulos se realiza exclusivamente mediante bordes finos `#e2e8f0`.
- **Panel Float / Dropdown:** Sombra suave e industrial (`box-shadow: 0 4px 12px -2px rgba(15, 23, 42, 0.08)`).
- **Modal Overlay:** Elevación focalizada (`box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.15)`).

### Named Rules
**The Boundary over Shadow Rule.** La estructura y jerarquía de la pantalla la definen los bordes definidos de 1px y los cambios sutiles de fondo (Slate 50 vs Blanco), no el apilamiento de sombras difusas.

## Shapes

- **Corner Radius:** 6px en botones pequeños, badges e inputs; 8px en tarjetas y modales principales.
- **Form Language:** Geometría recta y precisa. Evitar bordes excesivamente redondeados ("pill shape") salvo en insignias de estado compactas.
- **Borders:** 1px solid `#e2e8f0` en todos los contenedores de datos.

## Components

### Buttons
- **Shape:** Radio de 6px (`rounded-md`).
- **Primary (Safety Action):** Fondo `#f97316`, texto `#ffffff`, `padding: 10px 20px`, fuente `Space Grotesk` Medium. Hover: `#ea580c`.
- **Secondary (Blueprint Action):** Fondo `#2563eb`, texto `#ffffff`, `padding: 10px 20px`. Hover: `#1d4ed8`.
- **Outline / Ghost:** Fondo transparente, borde 1px `#e2e8f0`, texto `#0f172a`. Hover: fondo `#f1f5f9`.

### Gantt Chart Bars
- **Partida Normal:** Barra azul `#2563eb` con borde sutil.
- **Partida Crítica:** Barra naranja `#f97316` destacada.
- **Avance Completado:** Relleno de contraste al 100% sobre la barra.

### Cards / Containers
- **Background:** `#ffffff` sobre canvas `#f8fafc`.
- **Border:** 1px solid `#e2e8f0`.
- **Internal Padding:** `16px` o `24px` según densidad.

### Inputs / Fields
- **Style:** Fondo `#ffffff`, borde 1px `#cbd5e1`, radio 6px.
- **Focus:** Borde `#2563eb` con un anillo sutil `0 0 0 2px rgba(37, 99, 235, 0.15)`.

## Do's and Don'ts

### Do:
- **Do** mantener una tipografía monoespaciada (`JetBrains Mono`) para todos los datos numéricos y de fechas.
- **Do** utilizar bordes nítidos de 1px (`#e2e8f0`) para delimitar módulos de partidas y cronogramas.
- **Do** emplear el naranja `#f97316` para resaltar la ruta crítica y las acciones prioritarias de obra.

### Don't:
- **Don't** usar fondos oscuros o morados con neón para la interfaz de trabajo (mantener estética *Technical Blueprint Light*).
- **Don't** aplicar sombreados voluminosos ni gradientes vistosos en las barras del Gantt o tarjetas.
- **Don't** saturar con más de un 10% de acento naranja en la pantalla para conservar su impacto como señal de seguridad.
