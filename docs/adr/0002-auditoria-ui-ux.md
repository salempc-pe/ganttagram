# ADR-0002: Auditoría Integral UI/UX y Sistema Visual Blueprint

**Fecha:** 12/02/2026  
**Estado:** Aprobado / Implementado  
**Contexto:** La interfaz presentaba inconsistencias en densidad, conflictos de estilos en `#root` de Vite, tamaños de botones por debajo de estándares de accesibilidad táctil (WCAG < 44px) y uso disperso de iconos emoji.

---

## Decisión

1. **Limpieza de estilos base**: Eliminación de reglas residuales de Vite en `App.css` para permitir el layout fluido de alta densidad.
2. **Accesibilidad en campo**: Asegurar touch targets mínimos de 40-44px en móviles y contraste > 12:1 (Slate 900 sobre Slate 50/White).
3. **Estandarización de iconografía**: Sustituir emojis por iconos SVG de `lucide-react`.
4. **Armonización de espaciados y radios**: Unificar `border-radius: var(--radius-md)` (6-8px) y gaps coherentes entre el dashboard y el visor Gantt.
5. **Lenguaje visual técnico**: Consolidar el estilo *Industrial-Tech Premium / Technical Blueprint* con tipografías `Space Grotesk`, `Inter` y `JetBrains Mono`.

---

## Consecuencias

- Interfaz profesional apta para uso intensivo en laptops y dispositivos móviles en obra sin distracciones decorativas.
