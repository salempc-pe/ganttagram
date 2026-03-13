import { startOfDay, endOfDay, addDays } from 'date-fns';
import { addWorkingDays, getWorkingDuration, adjustToWorkingDay } from '../../../shared/utils/calendar';

/**
 * Calcula las nuevas fechas para un conjunto de tareas e hitos basándose en dependencias.
 * Respeta el calendario de días laborables y FUERZA el cumplimiento de dependencias.
 */
export const calculateAutoSchedule = (tasks, dependencies, triggerId, updatedDates, milestones = [], calendar = null) => {
    const itemMap = {};

    // Optimización: Pre-mapear dependencias por origen para búsqueda O(1)
    const depsByFrom = {};
    const depsByTo = {};

    dependencies.forEach(d => {
        if (!depsByFrom[d.fromTaskId]) depsByFrom[d.fromTaskId] = [];
        depsByFrom[d.fromTaskId].push(d);

        if (!depsByTo[d.toTaskId]) depsByTo[d.toTaskId] = [];
        depsByTo[d.toTaskId].push(d);
    });

    // Normalizar todo a un mapa con startDate/endDate base
    tasks.forEach(t => {
        itemMap[t.id] = {
            ...t,
            _type: 'task',
            _start: startOfDay(new Date(t.startDate)),
            _end: endOfDay(new Date(t.endDate))
        };
    });

    milestones.forEach(m => {
        const d = startOfDay(new Date(m.date));
        itemMap[m.id] = {
            ...m,
            _type: 'milestone',
            _start: d,
            _end: d
        };
    });

    const queue = [triggerId];
    // 0. APLICAR CAMBIO INICIAL AL TRIGGER
    if (itemMap[triggerId]) {
        const currentTrigger = itemMap[triggerId];
        const oldStart = new Date(currentTrigger._start);
        const oldEnd = new Date(currentTrigger._end);
        const workingDuration = getWorkingDuration(oldStart, oldEnd, calendar);

        if (updatedDates.startDate || updatedDates.date) {
            currentTrigger._start = startOfDay(new Date(updatedDates.startDate || updatedDates.date));
            if (!updatedDates.endDate) {
                currentTrigger._end = endOfDay(addWorkingDays(currentTrigger._start, workingDuration - 1, calendar));
            }
        }
        if (updatedDates.endDate) {
            currentTrigger._end = endOfDay(new Date(updatedDates.endDate));
            if (!updatedDates.startDate && !updatedDates.date) {
                // Cálculo optimizado sin bucle lineal para el inicio
                currentTrigger._start = startOfDay(addWorkingDays(currentTrigger._end, -(workingDuration - 1), calendar, -1));
            }
        }

        // ¡IMPORTANTE! Actualizar la duración en el mapa para que snapToPredecessors no la sobreescriba con la vieja
        const newDuration = getWorkingDuration(currentTrigger._start, currentTrigger._end, calendar);
        currentTrigger.duration = newDuration.toString();

        const deltaDays = Math.round((currentTrigger._start.getTime() - oldStart.getTime()) / (1000 * 60 * 60 * 24));
        if (deltaDays !== 0) {
            shiftDescendants(triggerId, deltaDays, itemMap, queue, tasks, calendar);
        }
    }

    // 1. AJUSTAR EL TRIGGER BASADO EN SUS PREDECESORES
    snapToPredecessors(triggerId, itemMap, depsByTo[triggerId] || [], calendar);

    const updates = {};
    const visited = new Set();
    let iterations = 0;
    const maxIterations = (tasks.length + milestones.length) * 10;

    while (queue.length > 0 && iterations < maxIterations) {
        iterations++;
        const currentId = queue.shift();

        const currentItem = itemMap[currentId];
        if (!currentItem) continue;

        // Registrar cambios
        if (currentItem._type === 'milestone') {
            updates[currentId] = { date: currentItem._start };
        } else {
            updates[currentId] = {
                startDate: startOfDay(currentItem._start),
                endDate: endOfDay(currentItem._end)
            };
        }

        // Buscar sucesores O(1) con el mapa pre-calculado
        const successors = depsByFrom[currentId] || [];

        for (const dep of successors) {
            const succ = itemMap[dep.toTaskId];
            if (!succ) continue;

            const oldS = new Date(succ._start);
            const oldE = new Date(succ._end);

            snapToPredecessors(succ.id, itemMap, depsByTo[succ.id] || [], calendar);

            if (succ._start.getTime() !== oldS.getTime() || succ._end.getTime() !== oldE.getTime()) {
                // Si el elemento movido tiene hijos, debemos desplazarlos el mismo delta
                const deltaDays = Math.round((succ._start.getTime() - oldS.getTime()) / (1000 * 60 * 60 * 24));
                if (deltaDays !== 0) {
                    shiftDescendants(succ.id, deltaDays, itemMap, queue, tasks, calendar);
                }
                queue.push(dep.toTaskId);
            }
        }
    }

    return updates;
};

/**
 * Desplaza recursivamente todos los hijos de una tarea por un delta de días.
 * Los añade a la cola de procesamiento si tienen dependencias salientes.
 */
function shiftDescendants(parentId, deltaDays, itemMap, queue, tasks, calendar) {
    const children = tasks.filter(t => t.parentId === parentId);
    
    children.forEach(child => {
        const item = itemMap[child.id];
        if (!item) return;

        const oldS = new Date(item._start);
        const oldE = new Date(item._end);

        // Desplazar fechas respetando calendario (aproximado por días)
        if (deltaDays > 0) {
            item._start = addWorkingDays(item._start, deltaDays, calendar);
            item._end = addWorkingDays(item._end, deltaDays, calendar);
        } else {
            item._start = addWorkingDays(item._start, deltaDays, calendar, -1);
            item._end = addWorkingDays(item._end, deltaDays, calendar, -1);
        }

        if (item._start.getTime() !== oldS.getTime() || item._end.getTime() !== oldE.getTime()) {
            // Añadir a la cola para que sus sucesores también se muevan
            queue.push(child.id);
            // Seguir bajando en el árbol
            shiftDescendants(child.id, deltaDays, itemMap, queue, tasks, calendar);
        }
    });
}

function snapToPredecessors(itemId, itemMap, itemDeps, calendar) {
    const item = itemMap[itemId];
    if (!item || itemDeps.length === 0) return;

    const storedDuration = parseInt(item.duration, 10);
    const workingDuration = !isNaN(storedDuration) && storedDuration > 0
        ? storedDuration
        : getWorkingDuration(item._start, item._end, calendar);

    let maxStart = null;

    itemDeps.forEach(dep => {
        const pred = itemMap[dep.fromTaskId];
        if (!pred) return;

        const lag = parseInt(dep.lag || 0, 10);
        let impliedStart = null;

        switch (dep.type) {
            case 'FS':
                // FI: Empieza después de que termina el predecesor
                // 1 día después del fin del predecesor + lag.
                impliedStart = addWorkingDays(pred._end, 1 + lag, calendar);
                break;
            case 'SS':
                // II: Empieza después de que empieza el predecesor
                impliedStart = addWorkingDays(pred._start, lag, calendar);
                break;
            case 'FF': {
                // FF: Termina después de que termina el predecesor
                const targetEnd = addWorkingDays(pred._end, lag, calendar);
                impliedStart = addWorkingDays(targetEnd, -(workingDuration - 1), calendar, -1);
                break;
            }
            case 'SF': {
                // IF: Termina después de que empieza el predecesor
                const targetEnd = addWorkingDays(pred._start, lag, calendar);
                impliedStart = addWorkingDays(targetEnd, -(workingDuration - 1), calendar, -1);
                break;
            }
        }

        if (impliedStart && (!maxStart || impliedStart.getTime() > maxStart.getTime())) {
            maxStart = impliedStart;
        }
    });

    if (maxStart) {
        item._start = maxStart;
        if (item._type !== 'milestone') {
            item._end = endOfDay(addWorkingDays(item._start, workingDuration - 1, calendar));
        } else {
            item._end = maxStart;
        }
    }
}
