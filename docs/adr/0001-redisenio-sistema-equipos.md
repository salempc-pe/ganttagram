# ADR-0001: Rediseño del Sistema de Equipos y Permisos

**Fecha:** 12/02/2026  
**Estado:** Aprobado / Implementado  
**Contexto:** Se detectó un error crítico donde `addMember()` no persistía el documento en la subcolección `members`, provocando que usuarios invitados quedasen en estado de solo lectura (viewers) o inconsistente. Existían mecanismos frágiles de auto-repair que enmascaraban fallos en `useMembers` y `useProjectPermissions`.

---

## Decisión

Reescribir desde cero los módulos `useMembers`, `useProjectPermissions` y `ProjectMembers`:
1. **Persistencia atómica**: La invitación crea el documento en la subcolección `members` y actualiza los arrays de visibilidad (`members` y `editors`) en el documento raíz del proyecto en una sola transacción o batch.
2. **Eliminación de auto-repair**: Suprimir rutinas heurísticas de auto-reparación y queries de fallback que ocultaban fallos de consistencia.
3. **Manejo de permisos determinista**: Los permisos se calculan exclusivamente a partir de la lista cargada por el listener en tiempo real.
4. **Estados de UI explícitos**: Usuarios sin UID activo en la plataforma figuran en estado "Pendiente" en la interfaz.
5. **Roles soportados**: `owner`, `editor`, `viewer`.

---

## Consecuencias

- **Positivas**: Flujo de permisos transparente, eliminación de estados zombi en la base de datos y debugging determinista.
- **Negativas / Mitigaciones**: Se mantiene la compatibilidad con el esquema previo sin requerir migraciones complejas de Firestore.
