import { Calendar, CheckCircle2, Circle, Edit2, Trash2, Flag } from 'lucide-react';
import { format } from 'date-fns';
import { useMilestones } from '../hooks/useMilestones';
import { useTasks } from '../../tasks/hooks/useTasks';
import { useCategories } from '../hooks/useCategories';
import './TaskList.css';

export const TaskList = ({ projectId, onEditTask, onEditMilestone, canEdit = true }) => {
    const { tasks, loading: tasksLoading, updateTask, deleteTask } = useTasks(projectId);
    const { milestones, loading: milestonesLoading, deleteMilestone } = useMilestones(projectId);
    const { categories } = useCategories(projectId);

    const getCategoryColor = (catId) => {
        const cat = categories.find(c => c.id === catId);
        return cat ? cat.color : '#cbd5e1';
    }

    if (tasksLoading || milestonesLoading) return <div className="p-4 text-center text-secondary">Cargando elementos...</div>;

    const handleDeleteTask = async (e, taskId) => {
        e.stopPropagation();
        if (window.confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
            await deleteTask(taskId);
        }
    };

    const handleDeleteMilestone = async (e, milestoneId) => {
        e.stopPropagation();
        if (window.confirm('¿Estás seguro de que deseas eliminar este hito?')) {
            await deleteMilestone(milestoneId);
        }
    };

    // Combinar y ordenar (por fecha de inicio para tareas, fecha para hitos)
    const allItems = [
        ...tasks.map(t => ({ ...t, type: 'task', sortDate: t.startDate })),
        ...milestones.map(m => ({ ...m, type: 'milestone', sortDate: m.date }))
    ].sort((a, b) => new Date(a.sortDate) - new Date(b.sortDate));

    return (
        <div className="task-list-container">
            <div className="task-list-header">
                <div>
                    <h3 className="text-lg font-bold uppercase tracking-wider text-slate-800">Listado de Actividades</h3>
                    <p className="text-secondary text-xs">Gestión técnica de cronograma y cumplimiento de hitos.</p>
                </div>
            </div>

            <div className="tasks-scroll">
                {allItems.length === 0 ? (
                    <div className="empty-tasks">
                        <p>No hay actividades creadas aún</p>
                    </div>
                ) : (
                    <div className="task-items animate-in">
                        {allItems.map(item => {
                            const isTask = item.type === 'task';
                            const dateLabel = isTask ?
                                (item.startDate && item.endDate ?
                                    `${format(item.startDate, "dd/MM")} - ${format(item.endDate, "dd/MM")}` :
                                    'Sin fechas') :
                                (item.date ? format(item.date, "dd/MM/yyyy") : 'Sin fecha');

                            return (
                                <div key={item.id} className={`task-card ${!isTask ? 'milestone-card' : ''}`}>
                                    <div className="task-card-main">
                                        <div
                                            className="task-status-wrapper"
                                            onClick={() => {
                                                if (!canEdit) return;
                                                if (isTask) updateTask(item.id, { progress: item.progress === 100 ? 0 : 100 });
                                            }}
                                            style={{ cursor: canEdit && isTask ? 'pointer' : 'default' }}
                                        >
                                            {isTask ? (
                                                item.progress === 100 ?
                                                    <CheckCircle2 size={22} className="text-success" /> :
                                                    <Circle size={22} className="text-tertiary" />
                                            ) : (
                                                <div className="milestone-icon-bg">
                                                    <Flag size={18} />
                                                </div>
                                            )}
                                        </div>

                                        <div className="task-card-content">
                                            <div className="task-header-row">
                                                <span className="task-id-tag">{isTask ? 'TAREA' : 'HITO'}</span>
                                                {isTask && item.categoryId && (
                                                    <span
                                                        className="category-pill"
                                                        style={{ backgroundColor: getCategoryColor(item.categoryId) + '15', color: getCategoryColor(item.categoryId), borderColor: getCategoryColor(item.categoryId) + '30' }}
                                                    >
                                                        {categories.find(c => c.id === item.categoryId)?.name || 'General'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="task-title-text">
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
                                                                    backgroundColor: item.progress === 100 ? 'var(--success)' : 'var(--sidebar-active)'
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
