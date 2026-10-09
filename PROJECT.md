# PROJECT.md — Propósito y Alcance

## 1. Visión del Producto
**GANTTAGRAM** es una plataforma de gestión de proyectos centrada en cronogramas Gantt de alto rendimiento, diseñada para satisfacer la dinámica técnica y normativa del sector de la construcción e ingeniería en el Perú (conforme a los estándares del Reglamento Nacional de Edificaciones - RNE).

El sistema opera tanto como aplicación web moderna como ejecutable de escritorio de alto rendimiento empaquetado con Tauri, proporcionando una experiencia reactiva tipo "instrumento de medición y control" para el seguimiento de obra.

---

## 2. Usuarios Objetivo
- **Ingenieros Residentes de Obra**: Planifican partidas diarias/semanales, controlan holguras y coordinan la ejecución física directa en campo.
- **Supervisores de Obra y Control de Proyectos**: Auditan avances porcentuales, monitorean la ruta crítica y verifican el cumplimiento contractual de plazos.
- **Gerentes de Proyecto / Construcción**: Analizan métricas consolidadas (días restantes, estado de recursos y partidas macro) en dashboards ejecutivos.

---

## 3. Propuesta de Valor
- **Programación ASAP Estricta**: Motor de scheduling topológico que sincroniza automáticamente las fechas de tareas predecesoras y sucesoras sin desfasajes manuales.
- **Estructura RNE Nativa**: Organización en partidas y subpartidas con metrados, unidades de medida y ponderación de pesos de avance.
- **Rendimiento Industrial en Terreno**: Interfaz optimizada para pantallas táctiles y laptops de obra, con visualización densa, modo claro y oscuro de alto contraste y capacidad de uso offline/escritorio.
- **Colaboración en Tiempo Real**: Persistencia y sincronización instantánea con Firebase Firestore y gestión granular de permisos de equipo (propietario, editor, lector).

---

## 4. Alcance y Funcionalidades Principales
- **Diagrama de Gantt Interactivo**: Visualización por días, semanas y meses; arrastre de barras, ajuste de duraciones y conexión visual de dependencias.
- **Detección Anti-Ciclos**: Validación en tiempo real para impedir dependencias circulares antes de su persistencia.
- **Gestión de Recursos y Equipos**: Asignación de personal, maquinaria, subcontratistas y permisos por proyecto.
- **Hitos y Partidas Resumen**: Diferenciación jerárquica clara entre partidas padre (agrupadoras) y partidas hijas de ejecución.
- **Dashboard Ejecutivo**: Resumen de indicadores clave de salud del proyecto, porcentaje general y avance físico.

---

## 5. Fuera de Alcance (Out of Scope)
Para mantener el foco y la ligereza del sistema, las siguientes funcionalidades están **formalmente fuera de alcance**:
- **Facturación electrónica y contabilidad SUNAT**: La aplicación gestiona cronogramas y metrados de avance físico, no emisión de comprobantes tributarios.
- **Modelado BIM 3D / Visores IFC pesados**: El visor se centra en la línea de tiempo (Gantt) y control de partidas, delegando el modelado volumétrico a software CAD/BIM externo.
- **Módulo de chat o mensajería en tiempo real**: Se utilizan notas de observación técnicas en tareas, evitando complejidad de mensajería social.
- **Sistemas ERP de compras masivas e inventario de almacén externo**: Se controlan recursos asignados a partidas, no cadenas logísticas completas de compra.

---

## 6. Mapa de Navegación y Rutas
- `/login` & `/register`: Autenticación de usuarios vía Firebase Auth.
- `/dashboard`: Panel general con proyectos activos, métricas globales y creación de proyectos.
- `/projects/:projectId`: Espacio de trabajo principal con visor Gantt, lista de partidas, filtros de escala temporal y gestión de integrantes.
