import React, { useMemo } from 'react';
import { ListTodo, Calendar, TrendingUp, Sun, Moon } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { useTheme } from '../../../shared/context/ThemeContext';

export const ProjectHeader = ({ project, tasks = [], resources = [], milestones = [], children }) => {
    const { theme, toggleTheme } = useTheme();
    const stats = useMemo(() => {
        const totalProgress = tasks.reduce((acc, t) => acc + (parseInt(t.progress) || 0), 0);
        const avgProgress = tasks.length > 0 ? Math.round(totalProgress / tasks.length) : 0;

        let daysLeft = 0;
        let dueDate = null;
        if (tasks.length > 0) {
            const endDates = tasks.map(t => new Date(t.end || t.endDate).getTime()).filter(t => !isNaN(t));
            if (endDates.length > 0) {
                const maxDate = new Date(Math.max(...endDates));
                dueDate = maxDate;
                daysLeft = differenceInDays(maxDate, new Date());
            }
        }

        const parentIds = new Set(tasks.map(t => t.parentId).filter(id => id));
        const pendingTasks = tasks.filter(t => !parentIds.has(t.id) && (parseInt(t.progress) || 0) < 100).length;
        const activeWorkers = resources.length;
        
        return {
            progress: avgProgress,
            daysLeft: daysLeft > 0 ? daysLeft : 0,
            dueDate,
            activeWorkers,
            pendingTasks
        };
    }, [tasks, resources]);

    const isDark = theme === 'dark';

    // Estilos de tarjeta exactos al mockup
    const cardStyle = {
        border: isDark ? '1px solid rgba(100, 140, 200, 0.25)' : '1px solid #cbd5e1',
        borderRadius: '14px',
        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#f1f5f9',
        padding: '16px 20px',
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
    };

    return (
        <header className="project-header" style={{
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            borderBottom: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
            padding: '36px 40px 12px 40px',
            width: '100%',
            flexShrink: 0,
            zIndex: 30,
        }}>
            <div style={{ maxWidth: '850px', margin: '0 auto', width: '100%' }}>
                {/* FILA 1: Título centrado + Toggle (dos iconos como en mockup) */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '28px' }}>
                    <h1 style={{
                        fontSize: '1.75rem', fontWeight: 900, textTransform: 'uppercase',
                        letterSpacing: '-0.02em', lineHeight: 1, margin: 0, padding: 0, border: 'none',
                        color: isDark ? '#f1f5f9' : '#0f172a', textAlign: 'center'
                    }}>
                        {project.name}
                    </h1>
                </div>

                {/* FILA 2: 3 tarjetas centradas alineadas — proporciones del mockup */}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '24px' }}>
                    {/* Tarjeta: Días Restantes */}
                    <div style={cardStyle}>
                        <Calendar size={32} style={{ color: '#3b82f6', flexShrink: 0 }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: isDark ? '#64748b' : '#94a3b8' }}>Días Restantes</span>
                            <span style={{ fontSize: '28px', fontWeight: 900, lineHeight: 1, color: isDark ? '#f1f5f9' : '#0f172a' }}>{stats.daysLeft}</span>
                        </div>
                    </div>

                    {/* Tarjeta: Tareas */}
                    <div style={cardStyle}>
                        <ListTodo size={32} style={{ color: '#3b82f6', flexShrink: 0 }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: isDark ? '#64748b' : '#94a3b8' }}>Tareas</span>
                            <span style={{ fontSize: '28px', fontWeight: 900, lineHeight: 1, color: isDark ? '#f1f5f9' : '#0f172a' }}>{stats.pendingTasks}</span>
                        </div>
                    </div>

                    {/* Tarjeta: Avance */}
                    <div style={cardStyle}>
                        <TrendingUp size={32} style={{ color: '#3b82f6', flexShrink: 0 }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: isDark ? '#64748b' : '#94a3b8' }}>Avance</span>
                            <span style={{ fontSize: '28px', fontWeight: 900, lineHeight: 1, color: isDark ? '#f1f5f9' : '#0f172a' }}>{stats.progress}%</span>
                        </div>
                    </div>
                </div>

                {/* FILA 3: Controles — SIN línea divisoria, alineados exactamente debajo de las tarjetas */}
                {children && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {children}
                    </div>
                )}
            </div>
        </header>
    );
};
