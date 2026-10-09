# ARCHITECTURE.md — Arquitectura y Flujos del Sistema

## 1. Visión General de la Arquitectura
GANTTAGRAM sigue una arquitectura por funcionalidades (**Feature-First Architecture**) en React, complementada por servicios de persistencia en la nube (Firebase Firestore y Auth) y capacidades de distribución multiplataforma (Web SPA y Desktop ejecutable vía Tauri).

```
┌─────────────────────────────────────────────────────────────┐
│                    React Router v7                          │
│          (/dashboard, /projects/:projectId, /login)         │
├─────────────────────────────────────────────────────────────┤
│                    src/features/                            │
│   ├── auth          (Login, Registro, Recuperación)         │
│   ├── dashboard     (Proyectos, Métricas, KPIs de Obra)     │
│   ├── projects      (Configuración de Proyecto, Miembros)   │
│   ├── tasks         (Partidas, Modal RNE, Scheduler, Ciclos)│
│   ├── gantt         (GanttChart wrapper, visualización)     │
│   ├── milestones    (Hitos y Entregables clave)             │
│   └── resources     (Mano de obra, Maquinaria, Materiales)  │
├─────────────────────────────────────────────────────────────┤
│                    src/shared/                              │
│   ├── context       (AuthProvider, ThemeProvider)           │
│   ├── components    (UI Primitives, Modales, Botones)       │
│   └── utils         (Calendar, Formato de Fechas)           │
├─────────────────────────────────────────────────────────────┤
│                    src/services/                            │
│   └── firebase      (Firestore SDK, Auth, Config)           │
├─────────────────────────────────────────────────────────────┤
│                    Tauri Desktop Runtime                    │
│   └── src-tauri     (Configuración de ventana nativa Rust)  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Flujos de Datos Críticos

### A. Sincronización en Tiempo Real (Firestore Listeners)
1. Al acceder a un proyecto (`/projects/:projectId`), los hooks especializados (`useProjects`, `useTasks`, `useMembers`, `useResources`) abren listeners en tiempo real (`onSnapshot`) con Firestore.
2. Cada colección o subcolección emite actualizaciones automáticas que actualizan el estado local de React sin necesidad de recargar la página.

### B. Motor de Programación ASAP y Detección de Ciclos
1. **Detección Anti-Ciclos**: Antes de persistir cualquier cambio de dependencias (en `TaskModal` o al mover tareas), se ejecuta un recorrido DFS (`detectCycle(tasks, taskId, dependencyId)`). Si se detecta un bucle cerrado, se rechaza la operación informando al usuario.
2. **Cálculo Topológico ASAP**: El motor en `src/features/tasks/utils/scheduler.js` ordena las tareas topológicamente y calcula la fecha de inicio más temprana posible (`startDate`) basada en la fecha de finalización (`endDate`) de sus predecesores directos.
3. **Bucle de Estabilidad en `useTasks`**: Se recalcula el cronograma garantizando convergencia en un número máximo acotado de iteraciones para evitar estados zombi.

### C. Recálculo Recursivo de Jerarquía (Partidas RNE)
1. Las tareas organizadas jerárquicamente (Partida Padre -> Subpartidas Hijas) se procesan mediante `src/features/tasks/utils/hierarchy.js`.
2. Cuando una tarea hija modifica sus fechas o su porcentaje de avance, el motor recalcula recursivamente hacia arriba:
   - `startDate` del padre = fecha mínima de sus hijos.
   - `endDate` del padre = fecha máxima de sus hijos.
   - `progress` del padre = promedio ponderado del avance de los hijos.

---

## 3. Esquema de Base de Datos (Cloud Firestore)

### Colección: `projects`
Documento: `projects/{projectId}`
- `name` (string): Nombre de la obra o proyecto.
- `code` (string): Código técnico de control.
- `ownerId` (string): UID del creador del proyecto.
- `members` (array<string>): Lista de correos / UIDs con acceso al proyecto.
- `editors` (array<string>): UIDs con privilegios de edición.
- `createdAt` / `updatedAt` (timestamp).

### Subcolecciones dentro de `projects/{projectId}`:

#### 1. `tasks` (`projects/{projectId}/tasks/{taskId}`)
- `name` (string): Descripción de la partida.
- `code` (string, opcional): Código RNE (ej. "01.02.03").
- `startDate` (timestamp): Fecha inicio calculada.
- `endDate` (timestamp): Fecha fin calculada.
- `duration` (number): Duración en días de calendario laboral.
- `progress` (number): Porcentaje de avance (0 a 100).
- `dependencies` (array<string>): IDs de tareas predecesoras.
- `parentId` (string | null): ID de la partida padre (si es subpartida).
- `resourceIds` (array<string>): Recursos asignados a la partida.
- `isMilestone` (boolean): Flag de hito.

#### 2. `members` (`projects/{projectId}/members/{memberId}`)
- `email` (string): Correo del colaborador.
- `role` (string): `"owner"` | `"editor"` | `"viewer"`.
- `userId` (string | null): UID si ya tiene cuenta en la plataforma.
- `status` (string): `"active"` | `"pending"`.

#### 3. `resources` (`projects/{projectId}/resources/{resourceId}`)
- `name` (string): Nombre del recurso o cuadrilla.
- `type` (string): `"personnel"` | `"machinery"` | `"material"`.
- `costPerUnit` (number, opcional): Costo asignado.

#### 4. `milestones` (`projects/{projectId}/milestones/{milestoneId}`)
- `name` (string): Nombre del hito contractual o entrega.
- `date` (timestamp): Fecha clave.

---

## 4. Patrones Adoptados y Convenciones
- **Feature Modules**: Toda la lógica, componentes y hooks relacionados con un dominio residen en `src/features/<feature>/`.
- **Atomic State Updates**: Las escrituras que afectan múltiples documentos (como invitaciones y listas de miembros) se realizan mediante `writeBatch` o transacciones de Firestore.
- **Strict Single-Source Scheduler**: Ningún componente calcula fechas en línea de forma aislada; todo cálculo pasa por `scheduler.js` y `hierarchy.js`.
- **Responsive Adaptive Density**: En Desktop se muestra la vista dividida completa (tabla técnica + lienzo de Gantt); en pantallas móviles se colapsa la cabecera en scroll para maximizar el área útil del gráfico.
