import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
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

    // Rastrear posición real del mouse para desvincular el tooltip del grid base
    const [pos, setPos] = useState({ x: -9999, y: -9999 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            setPos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const formatDateSafe = (date) => {
        try {
            if (!date) return '--';
            const d = new Date(date);
            return isNaN(d.getTime()) ? '--' : format(d, 'dd MMM, yyyy', { locale: es });
        } catch {
            return '--';
        }
    };

    return createPortal(
        <div
            className="gantt-tooltip"
            style={{
                pointerEvents: 'none',
                position: 'fixed',
                top: pos.y + 15,
                left: pos.x + 15,
                zIndex: 99999,
                margin: 0
            }}
        >
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
        </div>,
        document.body
    );
};

const CustomTaskListHeader = ({ headerHeight }) => {
    return (
        <div
            className="gantt-list-header-custom"
            style={{
                height: headerHeight,
                fontFamily: 'var(--font-title)',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'flex-end',
                paddingBottom: '8px',
                borderBottom: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                fontWeight: '800',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                position: 'relative',
                zIndex: 60
            }}
        >
            <div className="gantt-header-item" style={{ flex: '1', paddingLeft: '16px' }}>Partida / Tarea</div>
            <div className="gantt-header-item" style={{ width: '80px', textAlign: 'center' }}>Inicio</div>
            <div className="gantt-header-item" style={{ width: '80px', textAlign: 'center' }}>Fin</div>
        </div>
    );
};

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

const CustomTaskListTable = ({ rowHeight, tasks, fontSize, onExpanderClick }) => {
    return (
        <div style={{ fontFamily: 'var(--font-main)', fontSize: fontSize, background: 'var(--bg-primary)' }}>
            {tasks.map((task) => {
                const isProject = task.type === 'project';
                const isMilestone = task.type === 'milestone';
                const level = task._level || 0;
                const hasChildren = task._hasChildren;
                const isProjectRoot = task._level === -1;

                // Indentación: 16px base + 20px por nivel
                const indent = isProjectRoot ? 16 : 16 + Math.max(0, level) * 20;

                return (
                    <div
                        key={task.id}
                        className={`gantt-list-row ${hasChildren && !isProjectRoot ? 'gantt-parent-row' : ''}`}
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
                                paddingLeft: `${indent}px`,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            {task.hideChildren !== undefined ? (
                                <div
                                    onClick={() => onExpanderClick(task)}
                                    className="gantt-expander"
                                    style={{
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '4px',
                                        color: hasChildren && !isProjectRoot ? 'var(--sidebar-active)' : 'var(--text-tertiary)',
                                        background: hasChildren && !isProjectRoot ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                                        userSelect: 'none',
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    {task.hideChildren ? '▸' : '▾'}
                                </div>
                            ) : (
                                <div style={{ width: '20px' }} />
                            )}
                            <span style={{
                                fontWeight: isProject || (hasChildren && !isProjectRoot) ? '800' : '600',
                                color: isProjectRoot
                                    ? 'var(--text-primary)'
                                    : hasChildren
                                        ? 'var(--text-primary)'
                                        : 'var(--text-secondary)',
                                fontSize: isProjectRoot ? '13px' : hasChildren ? '12.5px' : '12px',
                                fontFamily: isProject || hasChildren ? 'var(--font-title)' : 'var(--font-main)',
                                textTransform: hasChildren && !isProjectRoot ? 'uppercase' : 'none',
                                letterSpacing: hasChildren && !isProjectRoot ? '0.02em' : 'normal'
                            }}>
                                {task._rawName || task.name}
                            </span>
                        </div>
                        <div className="gantt-list-cell" style={{
                            width: '80px',
                            textAlign: 'center',
                            color: 'var(--text-secondary)',
                            fontSize: '12px',
                            fontWeight: '600',
                            fontFamily: 'var(--font-main)',
                            fontVariantNumeric: 'tabular-nums' // UI/UX Polish
                        }}>
                            {formatDate(task.start)}
                        </div>
                        <div className="gantt-list-cell" style={{
                            width: '80px',
                            textAlign: 'center',
                            color: 'var(--text-secondary)',
                            fontSize: '12px',
                            fontWeight: '600',
                            fontFamily: 'var(--font-main)',
                            fontVariantNumeric: 'tabular-nums' // UI/UX Polish
                        }}>
                            {isMilestone ? '-' : formatDate(task.end)}
                        </div>
                    </div>
                );
            })}
        </div >
    );
};

export const GanttChart = ({ projectId, viewMode = ViewMode.Day, onDoubleClick, readOnly = false, onTaskChange }) => {
    const { data, loading } = useGanttData(projectId);

    // Estado local para manejar expand/collapse
    const [collapsedIds, setCollapsedIds] = useState(new Set());

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

    // Motor fluido de Sticky (Evita saltos visuales en tablas e indexaciones)
    useEffect(() => {
        const scroller = wrapperScrollRef.current;
        if (!scroller) return;

        let frameId;
        const handleScroll = () => {
            if (!ganttRef.current) return;

            cancelAnimationFrame(frameId);
            frameId = requestAnimationFrame(() => {
                if (!ganttRef.current || !scroller) return;

                const ganttRect = ganttRef.current.getBoundingClientRect();
                const scrollerRect = scroller.getBoundingClientRect();

                // El offset es simplemente cuánto se ha desplazado el scroller interno
                let offset = scroller.scrollTop;

                const maxOffset = Math.max(0, ganttRect.height - 50);
                if (offset > maxOffset) offset = maxOffset;

                const leftHeader = ganttRef.current.querySelector('.gantt-list-header-custom');
                const rightHeader = ganttRef.current.querySelector('[class*="_CZjuD"] > svg:first-child');

                if (leftHeader) {
                    leftHeader.style.transform = `translateY(${Math.floor(offset)}px)`;
                }

                if (rightHeader) {
                    rightHeader.style.transform = `translateY(${Math.floor(offset)}px)`;
                }
            });
        };

        scroller.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        return () => {
            scroller.removeEventListener('scroll', handleScroll);
            cancelAnimationFrame(frameId);
        };
    }, []);

    // Construir tasks con hideChildren aplicado + filtrar hijos ocultos
    const displayTasks = useMemo(() => {
        if (!data || data.length === 0) return [];

        // Aplicar estado colapsado a las tareas
        const tasksWithState = data.map(task => {
            if (task._hasChildren || task._level === -1) {
                return {
                    ...task,
                    hideChildren: collapsedIds.has(task.id)
                };
            }
            return { ...task };
        });

        // Filtrar tareas cuyos padres estén colapsados
        const visibleTasks = [];
        const hiddenParentIds = new Set();

        for (const task of tasksWithState) {
            // Verificar si algún ancestro está oculto
            const isHidden = task._parentId && hiddenParentIds.has(task._parentId);

            if (isHidden) {
                // Si está oculto y tiene hijos, sus hijos también se ocultan
                if (task._hasChildren) {
                    hiddenParentIds.add(task.id);
                }
                continue;
            }

            visibleTasks.push(task);

            // Si esta tarea está colapsada, marcar sus hijos para ocultarlos
            if (task.hideChildren && task._hasChildren) {
                hiddenParentIds.add(task.id);
            }
        }

        return visibleTasks;
    }, [data, collapsedIds]);

    // Sistema de Contraste Dinámico para etiquetas sobre barras
    useEffect(() => {
        if (!ganttRef.current) return;

        const getLuminance = (color) => {
            if (!color) return 0.5;
            let r, g, b;
            if (color.startsWith('#')) {
                const hex = color.replace('#', '');
                if (hex.length === 3) {
                    r = parseInt(hex[0] + hex[0], 16);
                    g = parseInt(hex[1] + hex[1], 16);
                    b = parseInt(hex[2] + hex[2], 16);
                } else {
                    r = parseInt(hex.substring(0, 2), 16);
                    g = parseInt(hex.substring(2, 4), 16);
                    b = parseInt(hex.substring(4, 6), 16);
                }
            } else if (color.startsWith('rgb')) {
                const rgb = color.match(/\d+/g);
                if (!rgb) return 0.5;
                r = parseInt(rgb[0]);
                g = parseInt(rgb[1]);
                b = parseInt(rgb[2]);
            } else {
                return 0.5;
            }
            return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        };

        const adjustLabelColors = () => {
            if (!ganttRef.current) return;
            const labels = ganttRef.current.querySelectorAll('text.barLabel');
            
            labels.forEach(label => {
                const parentGroup = label.closest('g');
                // Buscamos el rectángulo que representa el fondo de la barra o proyecto
                const barRect = parentGroup?.querySelector('rect[class*="Background"], rect[class*="barBackground"], rect[class*="projectBackground"]');

                if (barRect) {
                    // Usamos getComputedStyle para obtener el color real final
                    const style = window.getComputedStyle(barRect);
                    const bgColor = style.fill;
                    
                    if (bgColor && bgColor !== 'none' && bgColor !== 'transparent') {
                        const luminance = getLuminance(bgColor);
                        
                        // Si la luminancia es alta (barra clara), texto oscuro. Si es baja (barra oscura), texto claro.
                        // Umbral ajustado a 0.6 para mejor equilibrio
                        const isLight = luminance > 0.6;
                        const textColor = isLight ? '#0f172a' : '#ffffff';
                        const strokeColor = isLight ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.2)';

                        if (label.getAttribute('fill') !== textColor) {
                            label.style.setProperty('fill', textColor, 'important');
                            label.style.setProperty('stroke', strokeColor, 'important');
                            label.style.setProperty('stroke-width', '0.5px', 'important');
                            label.style.setProperty('paint-order', 'stroke fill', 'important');
                        }
                    } else {
                        // Fallback si no hay color detectable (ej: barras transparentes de proyecto en algunos temas)
                        // En modo oscuro forzamos blanco, en claro oscuro.
                        const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
                        label.style.setProperty('fill', isDarkTheme ? '#ffffff' : '#0f172a', 'important');
                    }
                }
            });
        };

        // Observar cambios en el SVG para re-aplicar cuando se mueva o cambie el Gantt
        const observer = new MutationObserver((mutations) => {
            adjustLabelColors();
        });

        observer.observe(ganttRef.current, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['fill', 'x', 'width', 'style', 'class']
        });

        // Ejecución inmediata y con pequeños delays para asegurar que el render de la librería ha terminado
        adjustLabelColors();
        const timers = [
            setTimeout(adjustLabelColors, 100),
            setTimeout(adjustLabelColors, 500),
            setTimeout(adjustLabelColors, 1000)
        ];

        return () => {
            observer.disconnect();
            timers.forEach(clearTimeout);
        };
    }, [displayTasks]);


    // Handler para expandir/colapsar memoizado para evitar re-renders
    const handleExpanderClick = useCallback((task) => {
        setCollapsedIds(prev => {
            const next = new Set(prev);
            if (next.has(task.id)) {
                next.delete(task.id);
            } else {
                next.add(task.id);
            }
            return next;
        });
    }, []);



    if (loading) return <div className="gantt-loading">Cargando cronograma...</div>;

    if (!displayTasks || displayTasks.length === 0) return (
        <div className="gantt-empty">
            <p>No hay tareas ni hitos para mostrar.</p>
            <p className="text-sm text-secondary">Agrega tareas en la pestaña de Lista para verlas aquí.</p>
        </div>
    );

    return (
        <div className="gantt-container-outer" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div
                ref={wrapperScrollRef}
                className="gantt-scroll-container"
                style={{ flex: 1, minHeight: 0, overflow: 'auto', position: 'relative' }}
            >
                <div
                    ref={ganttRef}
                    className={`gantt-wrapper ${!isListVisible ? 'list-collapsed' : ''}`}
                >
                    <Gantt
                        tasks={displayTasks}
                        viewMode={viewMode}
                        onDateChange={readOnly ? undefined : onTaskChange}
                        onProgressChange={undefined}
                        onDoubleClick={readOnly ? undefined : onDoubleClick}
                        onExpanderClick={handleExpanderClick}
                        TooltipContent={TooltipContent}
                        TaskListHeader={CustomTaskListHeader}
                        TaskListTable={CustomTaskListTable}
                        locale="es"
                        listCellWidth={window.innerWidth < 768 ? "160px" : "240px"}
                        columnWidth={viewMode === ViewMode.Day ? 64 : 110}
                        headerHeight={45} // Reduced from 80
                        rowHeight={48}    // Reduced from 52
                        barFill={70}
                        barCornerRadius={8}
                        handleWidth={10}
                        fontFamily="var(--font-main)"
                        fontSize="13px"   // Increased from 12px
                        arrowColor="var(--text-tertiary)"
                        arrowIndent={20}
                        todayColor="rgba(99, 102, 241, 0.08)"
                        preStepsCount={1}
                        postStepsCount={5}
                    />
                </div>
            </div>
        </div>
    );
};
