import { describe, it, expect } from 'vitest';
import { calculateAutoSchedule } from './scheduler';
import { startOfDay, addDays, format } from 'date-fns';

describe('Scheduler Logic', () => {
    const defaultCalendar = {
        workingDays: [1, 2, 3, 4, 5], // Lunes a Viernes
        holidays: []
    };

    const createDate = (daysFromNow) => {
        // Usar formato ISO completo para evitar ambigüedades de zona horaria
        const d = addDays(new Date('2026-02-02T00:00:00'), daysFromNow);
        return startOfDay(d);
    };

    it('should handle Finish-to-Start (FS) dependency', () => {
        const tasks = [
            { id: 'task-1', startDate: createDate(0), endDate: createDate(1) }, // Lunes a Martes (2 días)
            { id: 'task-2', startDate: createDate(0), endDate: createDate(1) }
        ];
        const dependencies = [
            { id: 'dep-1', fromTaskId: 'task-1', toTaskId: 'task-2', type: 'FS' }
        ];

        // Cambiar la fecha de task-1
        const updates = calculateAutoSchedule(
            tasks,
            dependencies,
            'task-1',
            { startDate: createDate(1), endDate: createDate(2) }, // Martes a Miércoles
            [],
            defaultCalendar
        );

        // task-2 debe empezar el Jueves (Miércoles + 1 día hábil si es FS estricto)
        // Según scheduler.js: minStart = addDays(startOfDay(from._end), 1) -> start(B) >= end(A) + 1
        // task-1 end es Miércoles. Miércoles + 1 = Jueves.
        expect(format(updates['task-2'].startDate, 'yyyy-MM-dd')).toBe('2026-02-05');
    });

    it('should handle Start-to-Start (SS) dependency', () => {
        const tasks = [
            { id: 'task-1', startDate: createDate(0), endDate: createDate(1) },
            { id: 'task-2', startDate: createDate(0), endDate: createDate(1) }
        ];
        const dependencies = [
            { id: 'dep-1', fromTaskId: 'task-1', toTaskId: 'task-2', type: 'SS' }
        ];

        // Mover task-1 al Miércoles
        const updates = calculateAutoSchedule(
            tasks,
            dependencies,
            'task-1',
            { startDate: createDate(2), endDate: createDate(3) },
            [],
            defaultCalendar
        );

        // task-2 debe empezar al menos el Miércoles
        expect(updates['task-2'].startDate.getTime()).toBeGreaterThanOrEqual(createDate(2).getTime());
    });

    it('should handle Finish-to-Finish (FF) dependency', () => {
        const tasks = [
            { id: 'task-1', startDate: createDate(0), endDate: createDate(1) }, // Lun-Mar
            { id: 'task-2', startDate: createDate(0), endDate: createDate(1) }  // Lun-Mar
        ];
        const dependencies = [
            { id: 'dep-1', fromTaskId: 'task-1', toTaskId: 'task-2', type: 'FF' }
        ];

        // Mover task-1 para que termine el Jueves
        const updates = calculateAutoSchedule(
            tasks,
            dependencies,
            'task-1',
            { startDate: createDate(2), endDate: createDate(3) }, // Mie-Jue
            [],
            defaultCalendar
        );

        // task-2 debe terminar al menos el Jueves
        expect(format(updates['task-2'].endDate, 'yyyy-MM-dd')).toBe('2026-02-05');
    });

    it('should handle Start-to-Finish (SF) dependency', () => {
        const tasks = [
            { id: 'task-1', startDate: createDate(2), endDate: createDate(3) }, // Mie-Jue
            { id: 'task-2', startDate: createDate(0), endDate: createDate(1) }  // Lun-Mar
        ];
        const dependencies = [
            { id: 'dep-1', fromTaskId: 'task-1', toTaskId: 'task-2', type: 'SF' }
        ];

        // task-2 debe terminar después del inicio de task-1 (Miércoles)
        const updates = calculateAutoSchedule(
            tasks,
            dependencies,
            'task-1',
            { startDate: createDate(3), endDate: createDate(4) }, // Jue-Vie
            [],
            defaultCalendar
        );

        // task-2 debe terminar al menos el Jueves
        expect(format(updates['task-2'].endDate, 'yyyy-MM-dd')).toBe('2026-02-05');
    });

    it('should propagate through diamond dependencies', () => {
        const tasks = [
            { id: 'A', startDate: createDate(0), endDate: createDate(0) }, // Lun
            { id: 'B', startDate: createDate(1), endDate: createDate(1) }, // Mar
            { id: 'C', startDate: createDate(1), endDate: createDate(1) }, // Mar
            { id: 'D', startDate: createDate(2), endDate: createDate(2) }  // Mie
        ];
        const deps = [
            { fromTaskId: 'A', toTaskId: 'B', type: 'FS' },
            { fromTaskId: 'A', toTaskId: 'C', type: 'FS' },
            { fromTaskId: 'B', toTaskId: 'D', type: 'FS' },
            { fromTaskId: 'C', toTaskId: 'D', type: 'FS' }
        ];

        // Mover A al Martes
        const updates = calculateAutoSchedule(tasks, deps, 'A', { startDate: createDate(1), endDate: createDate(1) }, [], defaultCalendar);

        // B y C deben moverse al Miércoles
        expect(format(updates['B'].startDate, 'yyyy-MM-dd')).toBe('2026-02-04');
        expect(format(updates['C'].startDate, 'yyyy-MM-dd')).toBe('2026-02-04');
        // D debe moverse al Jueves
        expect(format(updates['D'].startDate, 'yyyy-MM-dd')).toBe('2026-02-05');
    });

    it('should respect weekends', () => {
        const tasks = [
            { id: 'task-1', startDate: createDate(4), endDate: createDate(4) }, // Viernes
            { id: 'task-2', startDate: createDate(0), endDate: createDate(0) }
        ];
        const dependencies = [
            { fromTaskId: 'task-1', toTaskId: 'task-2', type: 'FS' }
        ];

        const updates = calculateAutoSchedule(tasks, dependencies, 'task-1', { startDate: createDate(4), endDate: createDate(4) }, [], defaultCalendar);

        // task-2 debe empezar el Lunes siguiente (no Sábado ni Domingo)
        expect(format(updates['task-2'].startDate, 'yyyy-MM-dd')).toBe('2026-02-09');
    });

    it('should update milestones', () => {
        const tasks = [{ id: 'task-1', startDate: createDate(0), endDate: createDate(0) }];
        const milestones = [{ id: 'm-1', date: createDate(0) }];
        const dependencies = [{ fromTaskId: 'task-1', toTaskId: 'm-1', type: 'FS' }];

        const updates = calculateAutoSchedule(tasks, dependencies, 'task-1', { startDate: createDate(1), endDate: createDate(1) }, milestones, defaultCalendar);

        expect(format(updates['m-1'].date, 'yyyy-MM-dd')).toBe('2026-02-04'); // T1 acaba Mar(3), M1 empieza T1.end+1 = Mie(4)
    });
});
