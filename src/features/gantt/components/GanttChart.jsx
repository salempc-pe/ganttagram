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
    const isMobile = window.innerWidth <= 767;

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
            <div className="gantt-header-item" style={{ flex: '1', paddingLeft: '16px', paddingRight: '12px' }}>Partida / Tarea</div>
            {!isMobile && <div className="gantt-header-item" style={{ width: '80px', textAlign: 'center' }}>Inicio</div>}
            {!isMobile && <div className="gantt-header-item" style={{ width: '80px', textAlign: 'center' }}>Fin</div>}
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
    const isMobile = window.innerWidth <= 767;

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
                                paddingRight: '12px',
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
                        {!isMobile && (
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
                        )}
                        {!isMobile && (
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
                        )}
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

    // Sistema de Contraste Dinámico y Accesibilidad para Texto del Gantt
    useEffect(() => {
        if (!ganttRef.current) return;

        // Fórmula YIQ que se ajusta perfectamente a la percepción del color real (Cyan, Magenta, etc.)
        const isColorLight = (color) => {
            if (!color || color === 'none' || color === 'transparent') return false; // Por defecto fallback a tema
            let r = 0, g = 0, b = 0;
            if (color.startsWith('#')) {
                const hex = color.replace('#', '');
                if (hex.length === 3) {
                    r = parseInt(hex[0] + hex[0], 16);
                    g = parseInt(hex[1] + hex[1], 16);
                    b = parseInt(hex[2] + hex[2], 16);
                } else if (hex.length >= 6) {
                    r = parseInt(hex.substring(0, 2), 16);
                    g = parseInt(hex.substring(2, 4), 16);
                    b = parseInt(hex.substring(4, 6), 16);
                }
            } else if (color.startsWith('rgb')) {
                const rgb = color.match(/\d+/g);
                if (!rgb || rgb.length < 3) return false;
                r = parseInt(rgb[0], 10);
                g = parseInt(rgb[1], 10);
                b = parseInt(rgb[2], 10);
            } else {
                return false;
            }
            // Umbral estandar 128 YIQ perceptual (W3C recommended)
            const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
            return yiq >= 128; // Si es verdadero, el color es claro (requiere texto OCSURO). Si es falso, requiere texto BLANCO.
        };

        const adjustLabelColors = () => {
            if (!ganttRef.current) return;
            const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
            
            // Selector Universal (agrupa todos los text dentro de groups, para evadir css modules hashing)
            const allTexts = ganttRef.current.querySelectorAll('svg text');

            allTexts.forEach(label => {
                const parentGroup = label.closest('g');
                if (!parentGroup) return;

                // Las barras del Gantt (tasks, projects, milestones) usualmente renderizan un rect o polygon.
                const barRect = parentGroup.querySelector('rect, polygon, path');
                
                if (barRect) {
                    const labelX = parseFloat(label.getAttribute('x') || 0);
                    const barX = parseFloat(barRect.getAttribute('x') || 0);
                    const barW = parseFloat(barRect.getAttribute('width') || 0);

                    // Sólo procesar textos que parezcan ser etiquetas asociadas al rect (en X y un umbral mínimo)
                    const labelYStr = label.getAttribute('y');
                    const labelStyleY = label.style.transform?.match(/translateY\(([\d.]+)px\)/)?.[1];
                    const labelY = parseFloat(labelYStr || labelStyleY || 0);

                    // Pequeña corrección para evitar teñir cabeceras mensuales
                    if (labelY < 40 && labelY !== 0 && !label.style.transform) return;

                    // isInside: Detectamos si el texto realmente está contenido en la barra
                    // Si el inicio del texto (labelX) empieza después de que termine la barra (barX + barW), está FUERA.
                    const isInside = labelX < (barX + barW - 2); 

                    if (isInside) {
                        let bgColor = barRect.getAttribute('fill');
                        if (!bgColor || bgColor === 'none' || bgColor === 'transparent') {
                            const style = window.getComputedStyle(barRect);
                            bgColor = style.fill;
                        }

                        if (bgColor && bgColor !== 'none' && bgColor !== 'transparent') {
                            const isLightBar = isColorLight(bgColor);
                            const textColor = isLightBar ? '#0f172a' : '#ffffff'; 
                            const strokeColor = isLightBar ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';

                            label.style.setProperty('fill', textColor, 'important');
                            label.style.setProperty('stroke', strokeColor, 'important');
                            label.style.setProperty('stroke-width', '0.4px', 'important');
                        } else {
                            // Elementos sin fondo sólido (proyectos/padres)
                            label.style.setProperty('fill', isDarkTheme ? '#ffffff' : '#0f172a', 'important');
                            label.style.setProperty('stroke', 'none', 'important');
                        }
                    } else {
                        // === TEXTO FUERA DE LA BARRA (Sobre el fondo del gráfico) ===
                        // Aplicamos el estándar sugerido: Claro en Oscuro, Oscuro en Claro.
                        const finalTextColor = isDarkTheme ? '#ffffff' : '#0f172a';
                        
                        label.style.setProperty('fill', finalTextColor, 'important');
                        label.style.setProperty('stroke', 'none', 'important');
                        label.style.setProperty('stroke-width', '0', 'important');
                        label.style.setProperty('opacity', '1', 'important');
                    }
                    
                    // === ALINEACIÓN MAESTRA (VERTICAL) ===
                    label.style.setProperty('dominant-baseline', 'central', 'important');
                    label.style.setProperty('alignment-baseline', 'central', 'important');
                    label.style.setProperty('paint-order', 'stroke fill', 'important');
                    
                    // === ESTILOS UNIVERSALES (UNIFORMIZACIÓN) ===
                    label.style.setProperty('font-weight', '700', 'important');
                    label.style.setProperty('font-family', 'var(--font-title)', 'important');
                    label.style.setProperty('font-size', '12px', 'important');
                } else {
                    // Fallback para textos sin contenedor claro (ej. fechas en cabecera si el observer es muy agresivo)
                    label.style.setProperty('font-weight', '700', 'important');
                    label.style.setProperty('font-family', 'var(--font-title)', 'important');
                }
            });
        };

        const observer = new MutationObserver((mutations) => {
            adjustLabelColors();
        });

        observer.observe(ganttRef.current, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['fill', 'x', 'width', 'style', 'class', 'transform']
        });

        const themeObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'data-theme') {
                    adjustLabelColors();
                }
            });
        });
        
        themeObserver.observe(document.documentElement, { 
            attributes: true, 
            attributeFilter: ['data-theme'] 
        });

        adjustLabelColors();
        const timers = [
            setTimeout(adjustLabelColors, 100),
            setTimeout(adjustLabelColors, 400),
            setTimeout(adjustLabelColors, 1000)
        ];

        return () => {
            observer.disconnect();
            themeObserver.disconnect();
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
