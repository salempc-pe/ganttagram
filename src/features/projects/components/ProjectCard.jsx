import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Settings2, Calendar, Copy, Trash2, Pencil } from 'lucide-react';
import './ProjectCard.css';

export const ProjectCard = ({ project, onOpen, onDelete, onDuplicate, onEdit }) => {
    return (
        <div className="project-card group" onClick={() => onOpen(project.id)}>
            <div className="project-card-header">
                <div className="project-visual">
                    <span className="project-emoji">{project.emoji || '🏗️'}</span>
                </div>
                <div className="project-actions">
                    <button
                        className="icon-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit();
                        }}
                        title="Configurar proyecto"
                    >
                        <Settings2 size={16} />
                    </button>
                    <button
                        className="icon-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('¿Deseas duplicar este proyecto?')) onDuplicate(project.id);
                        }}
                        title="Duplicar proyecto"
                    >
                        <Copy size={16} />
                    </button>
                    <button
                        className="icon-btn text-error"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('¿Estás seguro de eliminar este proyecto?')) onDelete(project.id);
                        }}
                        title="Eliminar proyecto"
                    >
                        <Trash2 size={16} />
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
                <div className="project-meta">
                    <Calendar size={12} />
                    <span>
                        {project.updatedAt ?
                            format(project.updatedAt, "d MMM yyyy", { locale: es }) :
                            'ACTIVO'
                        }
                    </span>
                </div>
                <div className="project-tag-id">
                    PROYECTO-{project.id.substring(0, 4).toUpperCase()}
                </div>
            </div>
        </div>
    );
};
