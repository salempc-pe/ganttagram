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
    }

    // 1. AJUSTAR EL TRIGGER BASADO EN SUS PREDECESORES
    validatePredecessors(triggerId, itemMap, depsByTo[triggerId] || [], calendar);

    const updates = {};
    const queue = [triggerId];
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

            applyDependencyConstraint(dep, currentItem, succ, calendar);

            if (succ._start.getTime() !== oldS.getTime() || succ._end.getTime() !== oldE.getTime()) {
                queue.push(dep.toTaskId);
            }
        }
    }

    return updates;
};

function validatePredecessors(itemId, itemMap, itemDeps, calendar) {
    const item = itemMap[itemId];
    if (!item || itemDeps.length === 0) return;

    const storedDuration = parseInt(item.duration, 10);
    const workingDuration = !isNaN(storedDuration) && storedDuration > 0
        ? storedDuration
        : getWorkingDuration(item._start, item._end, calendar);

    let changed = false;

    itemDeps.forEach(dep => {
        const pred = itemMap[dep.fromTaskId];
        if (!pred) return;

        const oldS = new Date(item._start);
        applyDependencyConstraint(dep, pred, item, calendar);
        if (item._start.getTime() !== oldS.getTime()) changed = true;
    });

    if (changed && item._type !== 'milestone') {
        item._end = endOfDay(addWorkingDays(item._start, workingDuration - 1, calendar));
    }
}

function applyDependencyConstraint(dep, from, to, calendar) {
    const storedDuration = parseInt(to.duration, 10);
    const duration = !isNaN(storedDuration) && storedDuration > 0
        ? storedDuration
        : getWorkingDuration(to._start, to._end, calendar);

    const lag = parseInt(dep.lag || 0);
    const effectiveLag = (dep.type === 'FS' || dep.type === 'SS') ? lag : -lag;

    switch (dep.type) {
        case 'FS': {
            const minStartFS = adjustToWorkingDay(addDays(startOfDay(from._end), 1 + effectiveLag), calendar, 1);
            if (to._start.getTime() < minStartFS.getTime()) {
                to._start = minStartFS;
                to._end = endOfDay(addWorkingDays(to._start, duration - 1, calendar));
            }
            break;
        }

        case 'SS': {
            const minStartSS = adjustToWorkingDay(addDays(startOfDay(from._start), effectiveLag), calendar, 1);
            if (to._start.getTime() < minStartSS.getTime()) {
                to._start = minStartSS;
                to._end = endOfDay(addWorkingDays(to._start, duration - 1, calendar));
            }
            break;
        }

        case 'FF': {
            const minEndFF = endOfDay(addDays(from._end, effectiveLag));
            if (to._end.getTime() < minEndFF.getTime()) {
                to._end = minEndFF;
                // Cálculo de inicio instantáneo sin bucles
                to._start = startOfDay(addWorkingDays(to._end, -(duration - 1), calendar, -1));
                // Asegurar que el fin sea exactamente el target (re-calc por si el inicio cayó en no laborable)
                to._end = endOfDay(addWorkingDays(to._start, duration - 1, calendar));
            }
            break;
        }

        case 'SF': {
            const minEndSF = endOfDay(addDays(from._start, effectiveLag));
            if (to._end.getTime() < minEndSF.getTime()) {
                to._end = minEndSF;
                to._start = startOfDay(addWorkingDays(to._end, -(duration - 1), calendar, -1));
                to._end = endOfDay(addWorkingDays(to._start, duration - 1, calendar));
            }
            break;
        }
    }
}

