import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Settings2, Calendar, Copy, Trash2, Building2 } from 'lucide-react';
import './ProjectCard.css';

export const ProjectCard = ({ project, onOpen, onDelete, onDuplicate, onEdit }) => {
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpen(project.id);
        }
    };

    const formattedDate = project.updatedAt
        ? format(project.updatedAt?.toDate ? project.updatedAt.toDate() : new Date(project.updatedAt), "d MMM yyyy", { locale: es })
        : 'ACTIVO';

    const safeProjectId = project.id ? String(project.id).substring(0, 4).toUpperCase() : '0000';

    return (
        <div
            className="project-card group"
            onClick={() => onOpen(project.id)}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="button"
            aria-label={`Proyecto ${project.name}, actualizado ${formattedDate}`}
        >
            <div className="project-card-header">
                <div className="project-visual">
                    <div className="project-icon-badge">
                        <Building2 size={20} className="text-primary" aria-hidden="true" />
                    </div>
                </div>
                <div className="project-actions">
                    <button
                        className="icon-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(project);
                        }}
                        aria-label={`Configurar proyecto ${project.name}`}
                        title="Configurar proyecto"
                    >
                        <Settings2 size={16} aria-hidden="true" />
                    </button>
                    <button
                        className="icon-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDuplicate(project);
                        }}
                        aria-label={`Duplicar proyecto ${project.name}`}
                        title="Duplicar proyecto"
                    >
                        <Copy size={16} aria-hidden="true" />
                    </button>
                    <button
                        className="icon-btn text-error"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(project);
                        }}
                        aria-label={`Eliminar proyecto ${project.name}`}
                        title="Eliminar proyecto"
                    >
                        <Trash2 size={16} aria-hidden="true" />
                    </button>
                </div>
            </div>

            <div className="project-card-body">
                <h3 className="project-title">{project.name}</h3>
                <p className="project-desc">
                    {project.description || 'Sin descripción técnica registrada.'}
                </p>
            </div>

            <div className="project-card-footer">
                <div className="project-meta font-tech">
                    <Calendar size={13} aria-hidden="true" />
                    <span>{formattedDate}</span>
                </div>
                <div className="project-tag-id font-tech">
                    PROYECTO-{safeProjectId}
                </div>
            </div>
        </div>
    );
};
