import { startOfDay, endOfDay, addDays } from 'date-fns';
import { addWorkingDays, getWorkingDuration, adjustToWorkingDay } from '../../../shared/utils/calendar';

/**
 * Calcula las nuevas fechas para un conjunto de tareas e hitos basándose en dependencias.
 * Respeta el calendario de días laborables y FUERZA el cumplimiento de dependencias.
 */
export const calculateAutoSchedule = (tasks, dependencies, triggerId, updatedDates, milestones = [], calendar = null) => {
    const itemMap = {};
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
        // Preservar la duración original si solo nos pasan el inicio (o viceversa)
        const currentTrigger = itemMap[triggerId];
        const oldStart = new Date(currentTrigger._start);
        const oldEnd = new Date(currentTrigger._end);
        const workingDuration = getWorkingDuration(oldStart, oldEnd, calendar);

        if (updatedDates.startDate || updatedDates.date) {
            currentTrigger._start = startOfDay(new Date(updatedDates.startDate || updatedDates.date));
            if (!updatedDates.endDate) {
                // Si no mandan fin, mantenemos duración
                currentTrigger._end = endOfDay(addWorkingDays(currentTrigger._start, workingDuration - 1, calendar));
            }
        }
        if (updatedDates.endDate) {
            currentTrigger._end = endOfDay(new Date(updatedDates.endDate));
            if (!updatedDates.startDate && !updatedDates.date) {
                // Si solo mandan fin, ajustamos inicio (simple)
                currentTrigger._start = startOfDay(addDays(currentTrigger._end, -(Math.max(1, workingDuration))));
                currentTrigger._start = adjustToWorkingDay(currentTrigger._start, calendar, 1);
            }
        }
    }

    // 1. AJUSTAR EL TRIGGER BASADO EN SUS PREDECESORES (Forzar restricciones)
    validatePredecessors(triggerId, itemMap, dependencies, calendar);

    const updates = {};
    const queue = [triggerId];
    let iterations = 0;
    const maxIterations = (tasks.length + milestones.length) * 10;

    while (queue.length > 0 && iterations < maxIterations) {
        iterations++;
        const currentId = queue.shift();

        const currentItem = itemMap[currentId];
        if (!currentItem) continue;

        // Registrar cambios finales realizados
        if (currentItem._type === 'milestone') {
            updates[currentId] = { date: currentItem._start };
        } else {
            updates[currentId] = {
                startDate: startOfDay(currentItem._start),
                endDate: endOfDay(currentItem._end)
            };
        }

        // Buscar sucesores
        const successors = dependencies.filter(d => d.fromTaskId === currentId);

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

/**
 * Ajusta un elemento para que cumpla con TODOS sus predecesores
 */
function validatePredecessors(itemId, itemMap, dependencies, calendar) {
    const item = itemMap[itemId];
    if (!item) return;

    const preds = dependencies.filter(d => d.toTaskId === itemId);
    if (preds.length === 0) return;

    const workingDuration = getWorkingDuration(item._start, item._end, calendar);
    let changed = false;

    // Iteramos hasta que se cumplan todos los predecesores (puede haber múltiples)
    preds.forEach(dep => {
        const pred = itemMap[dep.fromTaskId];
        if (!pred) return;

        const oldS = new Date(item._start);
        applyDependencyConstraint(dep, pred, item, calendar);
        if (item._start.getTime() !== oldS.getTime()) changed = true;
    });

    // Si cambió por predecesores, recalcular fin para mantener duración
    if (changed && item._type !== 'milestone') {
        item._end = endOfDay(addWorkingDays(item._start, workingDuration - 1, calendar));
    }
}

/**
 * Lógica central de ajuste de una dependencia específica
 */
function applyDependencyConstraint(dep, from, to, calendar) {
    const duration = getWorkingDuration(to._start, to._end, calendar);

    // NOTA: Las dependencias actúan como restricciones de tipo "mayor o igual que".
    // Solo ajustamos la tarea sucesora ('to') si esta viola la restricción (está "antes" de lo permitido).
    // Si la tarea sucesora ya está días después (holgura), NO se modifica.

    switch (dep.type) {
        case 'FS': { // Fin-a-Inicio: Start(B) >= End(A) + 1 día
            const minStartFS = adjustToWorkingDay(addDays(startOfDay(from._end), 1), calendar, 1);
            if (to._start.getTime() < minStartFS.getTime()) {
                to._start = minStartFS;
                to._end = endOfDay(addWorkingDays(to._start, duration - 1, calendar));
            }
            break;
        }

        case 'SS': { // Inicio-a-Inicio: Start(B) >= Start(A)
            const minStartSS = startOfDay(from._start);
            if (to._start.getTime() < minStartSS.getTime()) {
                to._start = minStartSS;
                to._end = endOfDay(addWorkingDays(to._start, duration - 1, calendar));
            }
            break;
        }

        case 'FF': { // Fin-a-Fin: End(B) >= End(A)
            const minEndFF = endOfDay(from._end);
            if (to._end.getTime() < minEndFF.getTime()) {
                to._end = minEndFF;
                // Ajustar inicio para mantener duración
                let testS = adjustToWorkingDay(addDays(to._end, -(duration + 7)), calendar, 1);
                let checkE = endOfDay(addWorkingDays(testS, duration - 1, calendar));
                while (checkE.getTime() < to._end.getTime()) {
                    testS = addDays(testS, 1);
                    checkE = endOfDay(addWorkingDays(testS, duration - 1, calendar));
                }
                to._start = startOfDay(testS);
                to._end = checkE;
            }
            break;
        }

        case 'SF': { // Inicio-a-Fin: End(B) >= Start(A)
            const minEndSF = endOfDay(from._start);
            if (to._end.getTime() < minEndSF.getTime()) {
                to._end = minEndSF;
                let testS2 = adjustToWorkingDay(addDays(to._end, -(duration + 7)), calendar, 1);
                let checkE2 = endOfDay(addWorkingDays(testS2, duration - 1, calendar));
                while (checkE2.getTime() < to._end.getTime()) {
                    testS2 = addDays(testS2, 1);
                    checkE2 = endOfDay(addWorkingDays(testS2, duration - 1, calendar));
                }
                to._start = startOfDay(testS2);
                to._end = checkE2;
            }
            break;
        }
    }
}
