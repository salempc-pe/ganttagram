# Plan: Rediseño del Sistema de Equipos

Reescribir desde cero `useMembers`, `useProjectPermissions` y `ProjectMembers` para corregir el bug crítico donde `addMember()` nunca crea el documento en la subcolección `members`, causando que editores invitados queden como viewers. Se eliminan todos los mecanismos de auto-repair y se implementa un flujo correcto y limpio.

## Scope

- In:
  - Reescribir `useMembers.js` con `addMember` que crea doc + actualiza arrays atómicamente
  - Reescribir `useProjectPermissions.js` sin auto-repair ni queries fallback
  - Reescribir `ProjectMembers.jsx` con UI de estado "Pendiente" para invitados sin cuenta
  - Reescribir `ProjectMembers.css` acorde al nuevo diseño
  - Validaciones: email duplicado, no invitar al owner, no self-invite
- Out:
  - Sistema de Resources (se mantiene igual)
  - Firestore Security Rules (se manejan por separado)
  - Notificaciones por email
  - Enlaces compartibles
  - Migración de datos existentes en Firestore

## Decision Log

| # | Decisión | Razón |
|---|---|---|
| 1 | Arquitectura con subcolección `members` + arrays de visibilidad | Mantiene compatibilidad, no requiere migración |
| 2 | `addMember` atómico: doc en subcolección + arrays en proyecto | Evita estado inconsistente que causaba el bug original |
| 3 | Eliminar auto-repair en `useMembers` y self-repair en `useProjectPermissions` | Escondían bugs, complicaban debugging |
| 4 | Permisos basados solo en lista cargada por listener | Sin queries fallback ni hacks |
| 5 | Miembros sin UID → estado "Pendiente" en UI | Transparencia para el usuario |
| 6 | Roles: owner, editor, viewer. Owner+editor pueden invitar | Colaboración flexible |

## Action Items

[x] 1. Reescribir `src/features/projects/hooks/useMembers.js` ✅
[x] 2. Reescribir `src/features/projects/hooks/useProjectPermissions.js` ✅
[x] 3. Reescribir `src/features/projects/components/ProjectMembers.jsx` ✅
[x] 4. Actualizar `src/features/projects/components/ProjectMembers.css` ✅
[x] 5. Verificar integración con `ProjectPage.jsx` ✅ (lazy import + props compatibles)
[x] 6. Verificar integración con `useProjects.js` ✅ (createProject crea owner correctamente)
[x] 7. Verificar que TaskModal no se ve afectado ✅ (usa resources, no members)
[x] 8. Build exitoso sin errores ✅

## Open Questions

- Ninguna
