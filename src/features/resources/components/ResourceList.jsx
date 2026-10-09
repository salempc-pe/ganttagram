import { Trash2, Edit2, User, PenTool, Briefcase, Plus, Package } from 'lucide-react';
import { Button } from '../../../shared/components/Button';
import './ResourceList.css';

const checkResourceConflicts = (assignedTasks) => {
    const conflicts = [];
    const parseDate = (d) => {
        if (!d) return null;
        if (typeof d.toDate === 'function') return d.toDate();
        if (d.seconds !== undefined) return new Date(d.seconds * 1000);
        return new Date(d);
    };

    for (let i = 0; i < assignedTasks.length; i++) {
        for (let j = i + 1; j < assignedTasks.length; j++) {
            const tA = assignedTasks[i];
            const tB = assignedTasks[j];
            const startA = parseDate(tA.startDate);
            const endA = parseDate(tA.endDate);
            const startB = parseDate(tB.startDate);
            const endB = parseDate(tB.endDate);

            if (startA && endA && startB && endB) {
                if (startA <= endB && startB <= endA) {
                    conflicts.push({
                        taskA: tA,
                        taskB: tB,
                        startOverlap: new Date(Math.max(startA.getTime(), startB.getTime())),
                        endOverlap: new Date(Math.min(endA.getTime(), endB.getTime()))
                    });
                }
            }
        }
    }
    return conflicts;
};

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
                        const conflicts = checkResourceConflicts(assignedTasks);
                        return (
                            <div key={resource.id} className="resource-card" style={{
                                border: conflicts.length > 0 ? '1.5px solid var(--red-500, #ef4444)30' : '1px solid var(--border-color)',
                                boxShadow: conflicts.length > 0 ? '0 4px 12px #ef444405' : 'var(--shadow-sm)',
                                position: 'relative'
                            }}>
                                {conflicts.length > 0 && (
                                    <div style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '8px', backgroundColor: '#ef444420', color: '#dc2626', padding: '1px 6px', borderRadius: '3px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Conflicto
                                    </div>
                                )}
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

                                {/* Sección de Uso de Recursos Integrada */}
                                <div className="resource-tasks-section" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <span className="tasks-label" style={{ fontWeight: '700', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        Uso y Reservas ({assignedTasks.length}):
                                    </span>
                                    {assignedTasks.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                            {assignedTasks.map(task => {
                                                const parseDate = (d) => {
                                                    if (!d) return null;
                                                    if (typeof d.toDate === 'function') return d.toDate();
                                                    if (d.seconds !== undefined) return new Date(d.seconds * 1000);
                                                    return new Date(d);
                                                };

                                                const formatDate = (dateVal) => {
                                                    const date = parseDate(dateVal);
                                                    if (!date) return '--';
                                                    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                                                };

                                                return (
                                                    <div key={task.id} style={{ display: 'flex', flexDirection: 'column', padding: '0.4rem 0.6rem', background: 'var(--bg-secondary)', borderRadius: '6px', fontSize: '0.75rem' }}>
                                                        <span style={{ fontWeight: '700', color: 'var(--text-primary)' }} className="truncate">{task.name}</span>
                                                        <span style={{ color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.7rem', marginTop: '1px' }}>
                                                            {formatDate(task.startDate)} al {formatDate(task.endDate)} ({task.duration} {parseInt(task.duration) === 1 ? 'día' : 'días'})
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontStyle: 'italic', margin: 0 }}>Disponible (Sin tareas asignadas)</p>
                                    )}

                                    {/* Alerta de Conflicto de Solape */}
                                    {conflicts.length > 0 && (
                                        <div style={{
                                            marginTop: '0.25rem',
                                            padding: '0.5rem 0.75rem',
                                            background: '#ef444410',
                                            border: '1px solid #ef444420',
                                            borderRadius: '8px',
                                            color: '#b91c1c',
                                            fontSize: '0.7rem',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.25rem'
                                        }}>
                                            <span style={{ fontWeight: '800' }}>⚠️ SOLAPE DE FECHAS</span>
                                            {conflicts.map((conf, index) => {
                                                const parseDate = (d) => {
                                                    if (!d) return null;
                                                    if (typeof d.toDate === 'function') return d.toDate();
                                                    if (d.seconds !== undefined) return new Date(d.seconds * 1000);
                                                    return new Date(d);
                                                };
                                                const formatDate = (dateVal) => {
                                                    const date = parseDate(dateVal);
                                                    if (!date) return '--';
                                                    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                                                };
                                                return (
                                                    <span key={index} style={{ fontWeight: '600' }}>
                                                        • Choque entre "{conf.taskA.name}" y "{conf.taskB.name}" ({formatDate(conf.startOverlap)} - {formatDate(conf.endOverlap)})
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <div className="resource-footer" style={{ borderTop: 'none', paddingTop: 0, marginTop: '0.25rem' }}>
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

