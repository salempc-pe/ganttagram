import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, CheckCircle, AlertCircle, Calendar, Link2 } from 'lucide-react';
import './ProjectBoard.css';

export const ProjectBoard = ({ tasks, dependencies = [], onTaskUpdate, canEdit }) => {
    // Agrupar tareas por estado aproximado basado en progreso
    const getStatus = (progress) => {
        if (progress === 100) return 'done';
        if (progress > 0) return 'in_progress';
        return 'todo';
    };

    // Inyectar dependencias en las tareas para el badge
    const tasksWithDeps = tasks.map(t => ({
        ...t,
        _myDeps: dependencies.filter(d => d.toTaskId === t.id || d.fromTaskId === t.id)
    }));

    const columns = {
        todo: { id: 'todo', label: 'Por Hacer', color: 'var(--text-secondary)', bg: 'var(--bg-secondary)', icon: AlertCircle },
        in_progress: { id: 'in_progress', label: 'En Progreso', color: 'var(--info)', bg: '#eff6ff', icon: Clock },
        done: { id: 'done', label: 'Completado', color: 'var(--success)', bg: '#f0fdf4', icon: CheckCircle }
    };

    const groupedTasks = {
        todo: tasksWithDeps.filter(t => getStatus(t.progress) === 'todo'),
        in_progress: tasksWithDeps.filter(t => getStatus(t.progress) === 'in_progress'),
        done: tasksWithDeps.filter(t => getStatus(t.progress) === 'done')
    };

    const handleDragStart = (e, taskId) => {
        e.dataTransfer.setData('taskId', taskId);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = async (e, status) => {
        e.preventDefault();
        if (!canEdit) return;

        const taskId = e.dataTransfer.getData('taskId');

        let newProgress = 0;
        if (status === 'in_progress') newProgress = 50;
        if (status === 'done') newProgress = 100;

        await onTaskUpdate(taskId, { progress: newProgress });
    };

    return (
        <div className="board-container" style={{ minHeight: '500px' }}>
            {/* Diagnóstico temporal para verificar datos */}
            {/* <div style={{position: 'absolute', top: 0, right: 0, padding: 5, fontSize: 10, background: '#eee'}}>
                Board: {tasks?.length || 0} tareas
            </div> */}

            {Object.values(columns).map(col => (
                <div
                    key={col.id}
                    className="board-column"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col.id)}
                    style={{ backgroundColor: col.bg }}
                >
                    <div className="column-header">
                        <div className="column-title">
                            <col.icon size={18} style={{ color: col.color }} />
                            <span>{col.label}</span>
                            <span className="task-count">{groupedTasks[col.id].length}</span>
                        </div>
                    </div>

                    <div className="column-content">
                        {groupedTasks[col.id].map(task => (
                            <div
                                key={task.id}
                                className="kanban-card"
                                draggable={canEdit}
                                onDragStart={(e) => handleDragStart(e, task.id)}
                            >
                                <div className="card-header">
                                    <span className="task-name">{task.name}</span>
                                    <span className="task-dates">
                                        <Calendar size={12} />
                                        {task.startDate instanceof Date && !isNaN(task.startDate.getTime()) ? format(task.startDate, "d MMM", { locale: es }) : '--'} - {task.endDate instanceof Date && !isNaN(task.endDate.getTime()) ? format(task.endDate, "d MMM", { locale: es }) : '--'}
                                    </span>
                                </div>
                                <div className="card-meta">
                                    {task._myDeps?.length > 0 && (
                                        <div className="dep-badge" title={`${task._myDeps.length} vinculaciones detectadas`}>
                                            <Link2 size={10} />
                                            <span>DEP ({task._myDeps.length})</span>
                                        </div>
                                    )}
                                </div>
                                <div className="progress-bar-mini">
                                    <div
                                        className="progress-fill"
                                        style={{
                                            width: `${task.progress || 0}%`,
                                            backgroundColor: col.color
                                        }}
                                    />
                                </div>
                            </div>
                        ))}

                        {groupedTasks[col.id].length === 0 && (
                            <div className="empty-column-state">
                                Sin tareas
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};
