import { Trash2, Edit2, User, PenTool, Briefcase, Plus, Package } from 'lucide-react';
import { Button } from '../../../shared/components/Button';
import './ResourceList.css';

export const ResourceList = ({ resources, loading, tasks = [], onAdd, onEdit, onDelete, canEdit = true }) => {
    if (loading) return <div className="resources-loading">Cargando recursos...</div>;

    const getIcon = (type) => {
        switch (type) {
            case 'person': return User;
            case 'equipment': return PenTool;
            case 'material': return Package;
            default: return User;
        }
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'person': return 'Personal';
            case 'equipment': return 'Maquinaria';
            case 'material': return 'Material';
            default: return 'Otro';
        }
    };

    const getAssignedTasks = (resourceId) => {
        return tasks.filter(task => task.resources && task.resources.includes(resourceId));
    };

    return (
        <div className="resources-container">
            <div className="section-header-pro">
                <div className="section-title-group">
                    <h3 className="section-title-pro">Recursos</h3>
                    <p className="section-subtitle-pro">Capital humano y suministros de obra.</p>
                </div>
                {canEdit && (
                    <Button variant="primary" size="sm" onClick={onAdd} className="btn-add-pro">
                        <Plus size={16} />
                        <span>Agregar</span>
                    </Button>
                )}
            </div>

            {resources.length === 0 ? (
                <div className="resources-empty">
                    <div className="bg-slate-50 p-6 rounded-full mb-4">
                        <Briefcase size={48} className="text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-medium">No hay recursos registrados aún.</p>
                    <p className="text-slate-400 text-sm mb-6">Comienza añadiendo personal o materiales para el proyecto.</p>
                    {canEdit && (
                        <Button variant="primary" size="sm" onClick={onAdd} className="px-6 shadow-sm">
                            Registrar primer recurso
                        </Button>
                    )}
                </div>
            ) : (
                <div className="resources-grid">
                    {resources.map((resource) => {
                        const Icon = getIcon(resource.type);
                        const assignedTasks = getAssignedTasks(resource.id);
                        return (
                            <div key={resource.id} className="resource-card">
                                <div className="resource-type-tag">
                                    {getTypeLabel(resource.type)}
                                </div>
                                <div className="resource-main">
                                    <div className="resource-avatar-container">
                                        <div
                                            className="resource-avatar"
                                            style={{
                                                backgroundColor: (resource.color || '#3b82f6') + '15',
                                                color: resource.color || '#3b82f6'
                                            }}
                                        >
                                            <Icon size={24} />
                                        </div>
                                        <div
                                            className="resource-color-dot"
                                            style={{ backgroundColor: resource.color || '#3b82f6' }}
                                        ></div>
                                    </div>
                                    <div className="resource-info">
                                        <h4 className="resource-name" title={resource.name}>{resource.name}</h4>
                                        <p className="resource-role truncate">{resource.role || 'General'}</p>
                                    </div>
                                </div>

                                {/* Seccion de Tareas Asignadas */}
                                <div className="resource-tasks-section">
                                    <span className="tasks-label">Tareas Asignadas ({assignedTasks.length}):</span>
                                    {assignedTasks.length > 0 ? (
                                        <div className="tasks-mini-list">
                                            {assignedTasks.slice(0, 3).map(task => (
                                                <div key={task.id} className="task-mini-item">
                                                    <div className="task-dot" style={{ backgroundColor: resource.color }}></div>
                                                    <span className="task-mini-name">{task.name}</span>
                                                </div>
                                            ))}
                                            {assignedTasks.length > 3 && (
                                                <span className="task-more-count">+{assignedTasks.length - 3} más...</span>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="no-tasks-text">Sin tareas asignadas</p>
                                    )}
                                </div>

                                <div className="resource-footer">
                                    <div className="resource-meta">
                                        {resource.type === 'material' && resource.quantity && (
                                            <span className="meta-badge">
                                                {resource.quantity} {resource.unit}
                                            </span>
                                        )}
                                        {resource.type !== 'material' && (
                                            <span className="meta-badge">Asignado</span>
                                        )}
                                    </div>
                                    {canEdit && (
                                        <div className="resource-actions">
                                            <button className="action-btn edit" onClick={() => onEdit(resource)} title="Editar">
                                                <Edit2 size={14} />
                                            </button>
                                            <button className="action-btn delete" onClick={() => onDelete(resource.id)} title="Eliminar">
                                                <Trash2 size={14} />
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
    );
};

