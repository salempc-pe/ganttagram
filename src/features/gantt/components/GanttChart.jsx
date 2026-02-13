import { useState, useEffect, useRef } from 'react';
import { Gantt, ViewMode } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
import { useGanttData } from '../hooks/useGanttData';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { List as ListIcon } from 'lucide-react';
import './GanttChart.css';

const TooltipContent = ({ task }) => {
    const isProject = task.type === 'project';
    const isMilestone = task.type === 'milestone';

    const formatDateSafe = (date) => {
        try {
            if (!date) return '--';
            const d = new Date(date);
            return isNaN(d.getTime()) ? '--' : format(d, 'dd MMM, yyyy', { locale: es });
        } catch {
            return '--';
        }
    };

    return (
        <div className="gantt-tooltip">
            <header className="gantt-tooltip-header">
                <span className={`task-badge ${task.type}`}>{task.type}</span>
                <h4 className="gantt-tooltip-title">{task.name}</h4>
            </header>

            <div className="gantt-tooltip-body">
                <div className="tooltip-row">
                    <span className="label">Inicio:</span>
                    <span>{formatDateSafe(task.start)}</span>
                </div>
                {!isMilestone && (
                    <div className="tooltip-row">
                        <span className="label">Fin:</span>
                        <span>{formatDateSafe(task.end)}</span>
                    </div>
                )}
                {!isProject && !isMilestone && (
                    <div className="tooltip-row">
                        <span className="label">Progreso:</span>
                        <span>{task.progress}%</span>
                    </div>
                )}

                {task.resources && task.resources.length > 0 && (
                    <div className="tooltip-resources">
                        <span className="label">Recursos:</span>
                        <div className="tooltip-resource-chips">
                            {task.resources.map(res => (
                                <span
                                    key={res.id}
                                    className="tooltip-res-chip"
                                    style={{ borderColor: res.color, color: res.color }}
                                >
                                    {res.name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const CustomTaskListHeader = ({ headerHeight }) => {
    return (
        <div
            className="gantt-list-header"
            style={{
                height: headerHeight,
                fontFamily: 'var(--font-title)',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                borderBottom: '2px solid var(--border-color)',
                background: 'var(--bg-primary)',
                fontWeight: '800',
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
            }}
        >
            <div className="gantt-header-item" style={{ flex: '1', paddingLeft: '20px' }}>Partida / Tarea</div>
            <div className="gantt-header-item" style={{ width: '80px', textAlign: 'center' }}>Inicio</div>
            <div className="gantt-header-item" style={{ width: '80px', textAlign: 'center' }}>Fin</div>
        </div>
    );
};

const CustomTaskListTable = ({ rowHeight, tasks, fontSize, onExpanderClick }) => {
    const formatDate = (date) => {
        try {
            if (!date) return '--';
            const d = new Date(date);
            if (isNaN(d.getTime())) return '--';
            return format(d, 'dd/MM/yy');
        } catch {
            return '--';
        }
    };

    return (
        <div style={{ fontFamily: 'var(--font-main)', fontSize: fontSize, background: 'var(--bg-primary)' }}>
            {tasks.map((task) => {
                const isProject = task.type === 'project';
                const isMilestone = task.type === 'milestone';

                return (
                    <div
                        key={task.id}
                        className="gantt-list-row"
                        style={{
                            height: `${rowHeight}px`,
                            display: 'flex',
                            alignItems: 'center',
                            borderBottom: '1px solid var(--bg-tertiary)'
                        }}
                    >
                        <div
                            className="gantt-list-cell"
                            style={{
                                flex: '1',
                                paddingLeft: '16px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            {task.hideChildren !== undefined ? (
                                <div
                                    onClick={() => onExpanderClick(task)}
                                    style={{
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        width: '18px',
                                        color: 'var(--sidebar-active)',
                                        userSelect: 'none',
                                        fontSize: '14px'
                                    }}
                                >
                                    {task.hideChildren ? '▸' : '▾'}
                                </div>
                            ) : (
                                <div style={{ width: '18px' }} />
                            )}
                            <span style={{
                                fontWeight: isProject ? '800' : '600',
                                color: isProject ? 'var(--text-primary)' : 'var(--text-secondary)',
                                fontSize: isProject ? '13px' : '12px',
                                fontFamily: isProject ? 'var(--font-title)' : 'var(--font-main)'
                            }}>
                                {task.name}
                            </span>
                        </div>
                        <div className="gantt-list-cell" style={{
                            width: '80px',
                            textAlign: 'center',
                            color: 'var(--text-secondary)',
                            fontSize: '11px',
                            fontWeight: '600',
                            fontFamily: 'var(--font-tech)'
                        }}>
                            {formatDate(task.start)}
                        </div>
                        <div className="gantt-list-cell" style={{
                            width: '80px',
                            textAlign: 'center',
                            color: 'var(--text-secondary)',
                            fontSize: '11px',
                            fontWeight: '600',
                            fontFamily: 'var(--font-tech)'
                        }}>
                            {isMilestone ? '-' : formatDate(task.end)}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export const GanttChart = ({ projectId, viewMode = ViewMode.Day, onDoubleClick, readOnly = false }) => {
    const { data, loading } = useGanttData(projectId);
    // Nota: useTasks y useMilestones están disponibles si se quiere habilitar edición directa en el Gantt

    // Referencias para scroll del wrapper completo
    const ganttRef = useRef(null);
    const wrapperScrollRef = useRef(null);

    // Estado para mostrar/ocultar la lista (en móvil empieza visible)
    const [isListVisible, setIsListVisible] = useState(true);

    // Actualizar visibilidad si cambia el tamaño de ventana
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) setIsListVisible(true);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);


    // Limitar el ancho del Gantt al rango real de fechas + margen
    useEffect(() => {
        if (!ganttRef.current || !data || data.length === 0) return;

        // Calcular el rango de fechas del proyecto
        const allDates = data.flatMap(item => [item.start, item.end]).filter(Boolean);
        if (allDates.length === 0) return;

        const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

        // Calcular días totales + margen de 5 días extra
        const daysDiff = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 5;

        // Calcular ancho basado en columnWidth y modo de vista
        const columnWidth = viewMode === ViewMode.Day ? 60 : 100;
        const listWidth = window.innerWidth < 768 ? 160 : 220;
        const calculatedWidth = listWidth + (daysDiff * columnWidth) + 50;

        // Aplicar width al gantt-wrapper para forzar el límite
        ganttRef.current.style.width = `${calculatedWidth}px`;
        ganttRef.current.style.maxWidth = `${calculatedWidth}px`;

    }, [data, viewMode]);


    // Funciones para cambio de tareas (deshabilitadas temporalmente - readOnly mode)
    // const handleTaskChange = async (task) => { ... };
    // const handleProgressChange = async (task) => { ... };


    if (loading) return <div className="gantt-loading">Cargando cronograma...</div>;

    if (!data || data.length === 0) return (
        <div className="gantt-empty">
            <p>No hay tareas ni hitos para mostrar.</p>
            <p className="text-sm text-secondary">Agrega tareas en la pestaña de Lista para verlas aquí.</p>
        </div>
    );

    return (
        <div className="gantt-container-outer">
            {/* Contenedor scrollable nativo que mueve tabla + gantt juntos */}
            <div
                ref={wrapperScrollRef}
                className="gantt-scroll-container"
            >
                <div
                    ref={ganttRef}
                    className={`gantt-wrapper ${!isListVisible ? 'list-collapsed' : ''}`}
                >
                    <Gantt
                        tasks={data}
                        viewMode={viewMode}
                        onDateChange={undefined}
                        onProgressChange={undefined}
                        onDoubleClick={readOnly ? null : onDoubleClick}
                        TooltipContent={TooltipContent}
                        TaskListHeader={CustomTaskListHeader}
                        TaskListTable={CustomTaskListTable}
                        locale="es"
                        listCellWidth={window.innerWidth < 768 ? "160px" : "240px"}
                        columnWidth={viewMode === ViewMode.Day ? 64 : 110}
                        headerHeight={80}
                        rowHeight={52}
                        barFill={70}
                        barCornerRadius={8}
                        handleWidth={10}
                        fontFamily="var(--font-main)"
                        fontSize="12px"
                        arrowColor="var(--text-tertiary)"
                        arrowIndent={20}
                        todayColor="rgba(99, 102, 241, 0.08)"
                        preStepsCount={1}
                    />
                </div>
            </div>
        </div>
    );
};

