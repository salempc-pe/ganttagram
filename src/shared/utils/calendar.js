import { addDays, getDay, format, startOfDay } from 'date-fns';

/**
 * Verifica si una fecha es día laborable según la configuración
 */
export const isWorkingDay = (date, calendar) => {
    if (!calendar) return true;

    const dayOfWeek = getDay(date);
    const workingDays = calendar.workingDays !== undefined ? calendar.workingDays : [1, 2, 3, 4, 5];

    if (!workingDays.includes(dayOfWeek)) return false;

    const holidays = calendar.holidays || [];
    const dateStr = format(date, 'yyyy-MM-dd');

    return !holidays.some(h => h === dateStr);
};

/**
 * Ajusta una fecha para que caiga en el próximo día laborable disponible
 */
export const adjustToWorkingDay = (date, calendar, direction = 1) => {
    let current = startOfDay(new Date(date));
    let attempts = 0;
    // Límite de seguridad para evitar bucles infinitos
    while (!isWorkingDay(current, calendar) && attempts < 365) {
        current = addDays(current, direction);
        attempts++;
    }
    return current;
};

/**
 * Calcula la duración en días laborables entre dos fechas (inclusive)
 */
export const getWorkingDuration = (startDate, endDate, calendar) => {
    if (!startDate || !endDate) return 1;
    let current = startOfDay(new Date(startDate));
    const target = startOfDay(new Date(endDate));

    if (current > target) return 0;

    let duration = 0;
    while (current <= target) {
        if (isWorkingDay(current, calendar)) {
            duration++;
        }
        current = addDays(current, 1);
    }
    return Math.max(1, duration);
};

/**
 * Agrega días laborables a una fecha inicial
 */
export const addWorkingDays = (startDate, days, calendar, directionArg = null) => {
    if (days === 0) return startOfDay(new Date(startDate));

    const direction = directionArg !== null ? directionArg : (days < 0 ? -1 : 1);
    const absDays = Math.abs(days);

    let current = startOfDay(new Date(startDate));
    // Asegurar que empezamos en un día laborable
    if (!isWorkingDay(current, calendar)) {
        current = adjustToWorkingDay(current, calendar, direction);
    }

    let added = 0;
    while (added < absDays) {
        current = addDays(current, direction);
        if (isWorkingDay(current, calendar)) {
            added++;
        }
    }

    return current;
};
