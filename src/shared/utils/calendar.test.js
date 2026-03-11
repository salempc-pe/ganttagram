import { describe, it, expect } from 'vitest';
import { isWorkingDay, adjustToWorkingDay, getWorkingDuration, addWorkingDays } from './calendar';
import { startOfDay } from 'date-fns';

describe('Calendar Utils', () => {
    const calendar = {
        workingDays: [1, 2, 3, 4, 5], // Mon-Fri
        holidays: ['2026-01-01']
    };

    describe('isWorkingDay', () => {
        it('should return true for a working day', () => {
            const date = new Date('2026-01-02T12:00:00'); // Friday
            expect(isWorkingDay(date, calendar)).toBe(true);
        });

        it('should return false for a weekend', () => {
            const date = new Date('2026-01-03T12:00:00'); // Saturday
            expect(isWorkingDay(date, calendar)).toBe(false);
        });

        it('should return false for a holiday', () => {
            const date = new Date('2026-01-01T12:00:00');
            expect(isWorkingDay(date, calendar)).toBe(false);
        });
    });

    describe('adjustToWorkingDay', () => {
        it('should not adjust if already a working day', () => {
            const date = new Date('2026-01-02T12:00:00');
            const adjusted = adjustToWorkingDay(date, calendar);
            expect(adjusted.getTime()).toBe(startOfDay(date).getTime());
        });

        it('should adjust weekend to next Monday', () => {
            const date = new Date('2026-01-03T12:00:00'); // Saturday
            const adjusted = adjustToWorkingDay(date, calendar);
            expect(adjusted.toISOString().split('T')[0]).toBe('2026-01-05'); // Monday
        });
    });

    describe('getWorkingDuration', () => {
        it('should calculate 1 day for same day', () => {
            const start = new Date('2026-01-02T10:00:00');
            const end = new Date('2026-01-02T15:00:00');
            expect(getWorkingDuration(start, end, calendar)).toBe(1);
        });

        it('should skip holidays and weekends', () => {
            const start = new Date('2025-12-31T10:00:00'); // Wed
            const end = new Date('2026-01-05T15:00:00'); // Mon
            // Dec 31 (Wed) - 1
            // Jan 01 (Thu) - Holiday (skip)
            // Jan 02 (Fri) - 2
            // Jan 03 (Sat) - Weekend (skip)
            // Jan 04 (Sun) - Weekend (skip)
            // Jan 05 (Mon) - 3
            expect(getWorkingDuration(start, end, calendar)).toBe(3);
        });
    });

    describe('addWorkingDays', () => {
        it('should add 1 day correctly', () => {
            const start = new Date('2026-01-02T10:00:00'); // Fri
            const result = addWorkingDays(start, 1, calendar);
            expect(result.toISOString().split('T')[0]).toBe('2026-01-05'); // Mon
        });

        it('should handle zero days', () => {
            const start = new Date('2026-01-02T10:00:00');
            const result = addWorkingDays(start, 0, calendar);
            expect(result.getTime()).toBe(startOfDay(start).getTime());
        });

        it('should subtract days when negative', () => {
            const start = new Date('2026-01-05T10:00:00'); // Mon
            const result = addWorkingDays(start, -1, calendar);
            expect(result.toISOString().split('T')[0]).toBe('2026-01-02'); // Fri (skip weekend)
        });

        it('should subtract days when positive but direction is negative', () => {
            const start = new Date('2026-01-05T10:00:00'); // Mon
            const result = addWorkingDays(start, 1, calendar, -1);
            expect(result.toISOString().split('T')[0]).toBe('2026-01-02'); // Fri
        });
    });
});
