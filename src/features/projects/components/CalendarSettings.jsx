import { useState } from 'react';
import { Calendar as CalendarIcon, X, Plus, Check } from 'lucide-react';
import { Button } from '../../../shared/components/Button';
import { format, parseISO } from 'date-fns';
import './CalendarSettings.css';

const DAYS = [
    { id: 0, label: 'D' },
    { id: 1, label: 'L' },
    { id: 2, label: 'M' },
    { id: 3, label: 'M' },
    { id: 4, label: 'J' },
    { id: 5, label: 'V' },
    { id: 6, label: 'S' },
];

export const CalendarSettings = ({ calendar, onUpdate, canEdit }) => {
    const [newHoliday, setNewHoliday] = useState('');

    const currentCalendar = calendar || {
        workingDays: [1, 2, 3, 4, 5],
        holidays: []
    };

    const toggleDay = (dayId) => {
        if (!canEdit) return;
        let newWorkingDays = [...(currentCalendar.workingDays || [])];
        if (newWorkingDays.includes(dayId)) {
            newWorkingDays = newWorkingDays.filter(id => id !== dayId);
        } else {
            newWorkingDays.push(dayId);
        }
        onUpdate({ ...currentCalendar, workingDays: newWorkingDays });
    };

    const addHoliday = () => {
        if (!newHoliday || !canEdit) return;
        const holidays = [...(currentCalendar.holidays || [])];
        if (!holidays.includes(newHoliday)) {
            holidays.push(newHoliday);
            // Ordenar feriados
            holidays.sort();
            onUpdate({ ...currentCalendar, holidays });
        }
        setNewHoliday('');
    };

    const removeHoliday = (dateStr) => {
        if (!canEdit) return;
        const holidays = (currentCalendar.holidays || []).filter(h => h !== dateStr);
        onUpdate({ ...currentCalendar, holidays });
    };

    return (
        <div className="calendar-settings">
            <h3 className="section-title">
                <CalendarIcon size={20} />
                Calendario de Obra
            </h3>

            <div className="settings-group">
                <label className="group-label">Días Laborables</label>
                <div className="week-selector">
                    {DAYS.map(day => (
                        <button
                            key={day.id}
                            className={`day-btn ${currentCalendar.workingDays?.includes(day.id) ? 'active' : ''}`}
                            onClick={() => toggleDay(day.id)}
                            type="button"
                            disabled={!canEdit}
                        >
                            {day.label}
                        </button>
                    ))}
                </div>
                <p className="helper-text">Selecciona los días que se trabaja normalmente.</p>
            </div>

            <div className="settings-group">
                <label className="group-label">Feriados y Días No Laborables</label>

                {canEdit && (
                    <div className="holiday-input-row">
                        <input
                            type="date"
                            value={newHoliday}
                            onChange={(e) => setNewHoliday(e.target.value)}
                            className="date-input"
                        />
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={addHoliday}
                            disabled={!newHoliday}
                        >
                            <Plus size={16} /> Agregar
                        </Button>
                    </div>
                )}

                <div className="holidays-list">
                    {(!currentCalendar.holidays || currentCalendar.holidays.length === 0) ? (
                        <p className="empty-text">No hay feriados configurados.</p>
                    ) : (
                        currentCalendar.holidays.map(dateStr => (
                            <div key={dateStr} className="holiday-tag">
                                <span>{format(parseISO(dateStr), 'dd/MM/yyyy')}</span>
                                {canEdit && (
                                    <button onClick={() => removeHoliday(dateStr)} className="remove-btn">
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
