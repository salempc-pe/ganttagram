import { useState, useMemo } from 'react';
import { Calendar, CheckCircle2, Circle, Edit2, Trash2, Flag, ChevronRight, ChevronDown, FolderTree } from 'lucide-react';
import { format } from 'date-fns';
import { useMilestones } from '../hooks/useMilestones';
import { useTasks } from '../../tasks/hooks/useTasks';
import { useCategories } from '../hooks/useCategories';
import { buildFlatTree, isParentTask } from '../../tasks/utils/hierarchy';
import './TaskList.css';

export const TaskList = ({ projectId, onEditTask, onEditMilestone, dependencies = [], milestones = [], projectCalendar = null, canEdit = true }) => {
    const { tasks, loading: tasksLoading, updateTask, deleteTask } = useTasks(projectId);
    const { loading: milestonesLoading, deleteMilestone } = useMilestones(projectId);
    const { categories } = useCategories(projectId);

    // Estado de expansión de tareas padre
    const [collapsedIds, setCollapsedIds] = useState(new Set());

    const getCategoryColor = (catId) => {
        const cat = categories.find(c => c.id === catId);
        return cat ? cat.color : '#cbd5e1';
    }

    const toggleCollapse = (taskId) => {
        setCollapsedIds(prev => {
            const next = new Set(prev);
            if (next.has(taskId)) {
                next.delete(taskId);
            } else {
                next.add(taskId);
            }
            return next;
        });
    };

    // Construir árbol plano de tareas ordenadas (Memoized for performance)
    const orderedTasks = useMemo(() => buildFlatTree(tasks), [tasks]);

    // Calcular tareas ocultas de manera eficiente O(N)
    const hiddenTaskIds = useMemo(() => {
        const hidden = new Set();
        let lastCollapsedLevel = -1;

        for (const task of orderedTasks) {
            // Si hay un nivel colapsado activo y la tarea actual es más profunda...
            if (lastCollapsedLevel !== -1 && (task._level || 0) > lastCollapsedLevel) {
                hidden.add(task.id);
            }
            // Si salimos del nivel colapsado (o estamos en el mismo nivel que el padre colapsado)
            else {
                lastCollapsedLevel = -1;
                // Revisar si ESTA tarea está colapsada para afectar a las siguientes
                if (collapsedIds.has(task.id)) {
                    lastCollapsedLevel = (task._level || 0);
                }
            }
        }
        return hidden;
    }, [orderedTasks, collapsedIds]);

    if (tasksLoading || milestonesLoading) return <div className="p-4 text-center text-secondary">Cargando elementos...</div>;

    const handleDeleteTask = async (e, taskId) => {
        e.stopPropagation();
        const hasChildren = isParentTask(taskId, tasks);
        const message = hasChildren
            ? '¿Estás seguro? Esta tarea es principal y se eliminarán también todas sus subtareas.'
            : '¿Estás seguro de que deseas eliminar esta tarea?';
        if (window.confirm(message)) {
            await deleteTask(taskId);
        }
    };

    const handleDeleteMilestone = async (e, milestoneId) => {
        e.stopPropagation();
        if (window.confirm('¿Estás seguro de que deseas eliminar este hito?')) {
            await deleteMilestone(milestoneId);
        }
    };

    // Combinar con hitos (los hitos van al final, sin jerarquía)
    const allItems = [
        ...orderedTasks.map(t => ({ ...t, type: 'task', sortDate: t.startDate })),
        ...milestones.map(m => ({ ...m, type: 'milestone', sortDate: m.date, _level: 0 }))
    ];

    return (
        <div className="task-list-container">

            <div className="tasks-scroll">
                {allItems.length === 0 ? (
                    <div className="empty-tasks">
                        <p>No hay actividades creadas aún</p>
                    </div>
                ) : (
                    <div className="task-items animate-in">
                        {allItems.map(item => {
                            const isTask = item.type === 'task';

                            // O(1) Lookup
                            const isHidden = isTask && hiddenTaskIds.has(item.id);

                            const hasChildren = isTask && isParentTask(item.id, tasks);
                            const isCollapsed = collapsedIds.has(item.id);
                            const level = item._level || 0;

                            const dateLabel = isTask ?
                                (item.startDate && item.endDate ?
                                    `${format(item.startDate, "dd/MM")} - ${format(item.endDate, "dd/MM")}` :
                                    'Sin fechas') :
                                (item.date ? format(item.date, "dd/MM/yyyy") : 'Sin fecha');

                            return (
                                <div
                                    key={item.id}
                                    className={`task-card ${!isTask ? 'milestone-card' : ''} ${hasChildren ? 'parent-task-card' : ''} ${isHidden ? 'collapsed-hidden' : ''}`}
                                    style={{ marginLeft: `${level * 24}px` }}
                                >
                                    <div className="task-card-main">
                                        <div
                                            className="task-status-wrapper"
                                            onClick={() => {
                                                if (hasChildren) {
                                                    toggleCollapse(item.id);
                                                    return;
                                                }
                                                if (!canEdit) return;
                                                if (isTask) updateTask(item.id, { progress: item.progress === 100 ? 0 : 100 }, dependencies, milestones, projectCalendar);
                                            }}
                                            style={{ cursor: (canEdit && isTask) || hasChildren ? 'pointer' : 'default' }}
                                        >
                                            {isTask ? (
                                                hasChildren ? (
                                                    <div className="parent-expand-icon">
                                                        {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                                                    </div>
                                                ) : (
                                                    item.progress === 100 ?
                                                        <CheckCircle2 size={22} className="text-success" /> :
                                                        <Circle size={22} className="text-tertiary" />
                                                )
                                            ) : (
                                                <div className="milestone-icon-bg">
                                                    <Flag size={18} />
                                                </div>
                                            )}
                                        </div>

                                        <div className="task-card-content">
                                            <div className="task-header-row">
                                                <span className="task-id-tag">
                                                    {isTask ? (hasChildren ? 'RESUMEN' : 'TAREA') : 'HITO'}
                                                </span>
                                                {isTask && item.categoryId && (
                                                    <span
                                                        className="category-pill"
                                                        style={{ backgroundColor: getCategoryColor(item.categoryId) + '15', color: getCategoryColor(item.categoryId), borderColor: getCategoryColor(item.categoryId) + '30' }}
                                                    >
                                                        {categories.find(c => c.id === item.categoryId)?.name || 'General'}
                                                    </span>
                                                )}
                                                {hasChildren && (
                                                    <span className="subtask-count-pill">
                                                        <FolderTree size={10} />
                                                        {tasks.filter(t => t.parentId === item.id).length}
                                                    </span>
                                                )}
                                            </div>
                                            <div className={`task-title-text ${hasChildren ? 'parent-title' : ''}`}>
                                                {item.name}
                                            </div>
                                            <div className="task-footer-row">
                                                <div className="task-date-info">
                                                    <Calendar size={13} />
                                                    <span className="font-tech">{dateLabel}</span>
                                                </div>
                                                {isTask && (
                                                    <div className="task-progress-mini">
                                                        <span className="progress-value font-tech">{item.progress}%</span>
                                                        <div className="progress-track">
                                                            <div
                                                                className="progress-bar-fill"
                                                                style={{
                                                                    width: `${item.progress}%`,
                                                                    backgroundColor: item.progress === 100 ? 'var(--success)' : hasChildren ? '#64748b' : 'var(--sidebar-active)'
                                                                }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {canEdit && (
                                            <div className="task-card-actions">
                                                <button
                                                    className="card-action-btn edit"
                                                    onClick={() => isTask ? onEditTask(item) : onEditMilestone(item)}
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    className="card-action-btn delete"
                                                    onClick={(e) => isTask ? handleDeleteTask(e, item.id) : handleDeleteMilestone(e, item.id)}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
