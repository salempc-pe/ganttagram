import { startOfDay, endOfDay } from 'date-fns';
import { getWorkingDuration } from '../../../shared/utils/calendar';

/**
 * Obtiene todos los ancestros de una tarea (padre, abuelo, bisabuelo...)
 * Retorna un array de IDs ordenados de hijo→padre→abuelo
 */
export function getAncestorIds(taskId, tasks) {
    const ancestors = [];
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    let current = taskMap.get(taskId);

    while (current && current.parentId) {
        ancestors.push(current.parentId);
        current = taskMap.get(current.parentId);
    }

    return ancestors;
}

/**
 * Obtiene todos los descendientes de una tarea (hijos, nietos, etc.)
 * Retorna un array de IDs
 */
export function getDescendantIds(taskId, tasks) {
    const descendants = [];
    const children = tasks.filter(t => t.parentId === taskId);

    for (const child of children) {
        descendants.push(child.id);
        descendants.push(...getDescendantIds(child.id, tasks));
    }

    return descendants;
}

/**
 * Verifica si una tarea tiene subtareas (es tarea resumen/padre)
 */
export function isParentTask(taskId, tasks) {
    return tasks.some(t => t.parentId === taskId);
}

/**
 * Calcula las fechas y progreso de una tarea padre basándose en sus hijos directos.
 * Si los hijos a su vez son padres, sus fechas ya deben estar calculadas previamente.
 * 
 * @returns {{ startDate: Date, endDate: Date, progress: number } | null}
 */
export function calculateParentData(parentId, tasks, calendar = null) {
    const children = tasks.filter(t => t.parentId === parentId);

    if (children.length === 0) return null;

    // Filtrar hijos con fechas válidas
    const validChildren = children.filter(t => t.startDate && t.endDate);
    if (validChildren.length === 0) return null;

    // Inicio = la fecha más temprana de los hijos
    const minStart = new Date(Math.min(...validChildren.map(t => new Date(t.startDate).getTime())));

    // Fin = la fecha más tardía de los hijos
    const maxEnd = new Date(Math.max(...validChildren.map(t => new Date(t.endDate).getTime())));

    // Progreso = promedio ponderado por duración de trabajo
    let totalWeight = 0;
    let weightedProgress = 0;

    for (const child of validChildren) {
        const duration = getWorkingDuration(
            new Date(child.startDate),
            new Date(child.endDate),
            calendar
        ) || 1;

        totalWeight += duration;
        weightedProgress += (child.progress || 0) * duration;
    }

    const progress = totalWeight > 0 ? Math.round(weightedProgress / totalWeight) : 0;

    return {
        startDate: startOfDay(minStart),
        endDate: endOfDay(maxEnd),
        progress
    };
}

/**
 * Recalcula recursivamente TODOS los ancestros de una tarea dada.
 * Retorna un mapa { taskId: { startDate, endDate, progress } } con los cambios necesarios.
 * 
 * NOTA: Aplica los cambios al array `tasks` in-place para que los cálculos
 * de niveles superiores reflejen los cambios de niveles inferiores.
 */
export function recalculateAncestors(taskId, tasks, calendar = null) {
    const updates = {};
    const ancestorIds = getAncestorIds(taskId, tasks);
    const taskMap = new Map(tasks.map(t => [t.id, t]));

    // Recorrer desde el padre más cercano hacia arriba
    for (const ancestorId of ancestorIds) {
        const parentData = calculateParentData(ancestorId, tasks, calendar);

        if (!parentData) continue;

        const currentTask = taskMap.get(ancestorId);
        if (!currentTask) continue;

        const startChanged = !currentTask.startDate ||
            startOfDay(new Date(currentTask.startDate)).getTime() !== parentData.startDate.getTime();
        const endChanged = !currentTask.endDate ||
            endOfDay(new Date(currentTask.endDate)).getTime() !== parentData.endDate.getTime();
        const progressChanged = (currentTask.progress || 0) !== parentData.progress;

        if (startChanged || endChanged || progressChanged) {
            updates[ancestorId] = parentData;

            // Actualizar in-place para que la siguiente iteración (abuelo) use datos frescos
            currentTask.startDate = parentData.startDate;
            currentTask.endDate = parentData.endDate;
            currentTask.progress = parentData.progress;
        }
    }

    return updates;
}

/**
 * Construye una estructura de árbol plana ordenada en DFS (Depth-First Search)
 * para visualización en el Gantt.
 * 
 * @returns Array de tareas con propiedad `_level` indicando la profundidad (0 = raíz)
 */
export function buildFlatTree(tasks) {
    // Separar tareas raíz (sin parentId) y crear un mapa de hijos
    const childrenMap = new Map();
    const roots = [];

    for (const task of tasks) {
        if (!task.parentId) {
            roots.push(task);
        } else {
            if (!childrenMap.has(task.parentId)) {
                childrenMap.set(task.parentId, []);
            }
            childrenMap.get(task.parentId).push(task);
        }
    }

    // Ordenar raíces por fecha de inicio
    roots.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    const result = [];

    function dfs(task, level) {
        result.push({ ...task, _level: level });

        const children = childrenMap.get(task.id) || [];
        // Ordenar hijos por fecha de inicio
        children.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

        for (const child of children) {
            dfs(child, level + 1);
        }
    }

    for (const root of roots) {
        dfs(root, 0);
    }

    return result;
}
