import { useState } from 'react';
import { Plus, Search, AlertCircle, X } from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { ProjectCard } from './ProjectCard';
import { ProjectModal } from './ProjectModal';
import { Button } from '../../../shared/components/Button';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';
import { useNavigate } from 'react-router-dom';
import './ProjectList.css';

export const ProjectList = () => {
    const {
        projects,
        loading,
        error,
        createProject,
        deleteProject,
        duplicateProject,
        updateProject
    } = useProjects();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [feedbackError, setFeedbackError] = useState(null);

    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        actionType: null, // 'delete' | 'duplicate'
        project: null
    });

    const navigate = useNavigate();

    const handleCreateProject = async (projectData) => {
        setFeedbackError(null);
        if (editingProject) {
            const result = await updateProject(editingProject.id, projectData);
            if (result.success) {
                setEditingProject(null);
                setIsModalOpen(false);
            } else {
                setFeedbackError(`Error al actualizar el proyecto: ${result.error}`);
            }
            return;
        }

        const result = await createProject(projectData);
        if (result.success) {
            setIsModalOpen(false);
        } else {
            setFeedbackError(`Error al crear el proyecto: ${result.error}`);
        }
    };

    const handleEditProject = (project) => {
        setEditingProject(project);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProject(null);
    };

    const requestDeleteProject = (project) => {
        setConfirmState({
            isOpen: true,
            actionType: 'delete',
            project
        });
    };

    const requestDuplicateProject = (project) => {
        setConfirmState({
            isOpen: true,
            actionType: 'duplicate',
            project
        });
    };

    const handleConfirmAction = async () => {
        const { actionType, project } = confirmState;
        if (!project) return;
        setFeedbackError(null);

        if (actionType === 'delete') {
            const result = await deleteProject(project.id);
            if (!result.success) {
                setFeedbackError(`Error al eliminar el proyecto: ${result.error}`);
            }
        } else if (actionType === 'duplicate') {
            const result = await duplicateProject(project.id);
            if (!result.success) {
                setFeedbackError(`Error al duplicar el proyecto: ${result.error}`);
            }
        }

        setConfirmState({ isOpen: false, actionType: null, project: null });
    };

    const filteredProjects = projects.filter(p =>
        p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="loader-container"><div className="loader" role="status" aria-label="Cargando proyectos"></div></div>;
    if (error) return <div className="error-state p-4 text-error border border-error rounded-md text-center">Error al cargar proyectos: {error}</div>;

    return (
        <div className="project-list-container">
            {feedbackError && (
                <div className="toast-feedback error" role="alert">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={16} aria-hidden="true" />
                        <span>{feedbackError}</span>
                    </div>
                    <button
                        className="btn-close-minimal"
                        onClick={() => setFeedbackError(null)}
                        aria-label="Cerrar notificación"
                    >
                        <X size={16} aria-hidden="true" />
                    </button>
                </div>
            )}

            <div className="project-list-header">
                <h2>Todos los Proyectos de Obra</h2>

                {projects.length > 0 && (
                    <div className="search-bar">
                        <Search size={16} className="search-icon" aria-hidden="true" />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Buscar proyecto por nombre..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            aria-label="Buscar proyecto por nombre"
                        />
                    </div>
                )}

                <Button onClick={() => setIsModalOpen(true)} className="btn-new-project">
                    <Plus size={18} aria-hidden="true" />
                    <span>Nuevo Proyecto</span>
                </Button>
            </div>

            {projects.length === 0 ? (
                <div className="empty-state">
                    <h3>No tienes proyectos de obra aún</h3>
                    <p>Crea tu primer proyecto para comenzar a planificar partidas y cronogramas Gantt.</p>
                    <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                        Crear Primer Proyecto
                    </Button>
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="empty-state">
                    <p>No se encontraron proyectos activos con el término "{searchTerm}"</p>
                </div>
            ) : (
                <div className="projects-grid">
                    {filteredProjects.map(project => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onOpen={(id) => navigate(`/projects/${id}`)}
                            onDelete={requestDeleteProject}
                            onDuplicate={requestDuplicateProject}
                            onEdit={handleEditProject}
                        />
                    ))}
                </div>
            )}

            <ProjectModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleCreateProject}
                initialData={editingProject}
            />

            <ConfirmModal
                isOpen={confirmState.isOpen}
                onClose={() => setConfirmState({ isOpen: false, actionType: null, project: null })}
                onConfirm={handleConfirmAction}
                title={
                    confirmState.actionType === 'delete'
                        ? `¿Eliminar proyecto "${confirmState.project?.name}"?`
                        : `¿Duplicar proyecto "${confirmState.project?.name}"?`
                }
                message={
                    confirmState.actionType === 'delete'
                        ? 'Esta acción eliminará permanentemente la obra y todas sus partidas registradas.'
                        : 'Se creará una copia del proyecto con la misma estructura de partidas.'
                }
                confirmText={confirmState.actionType === 'delete' ? 'Eliminar Obra' : 'Duplicar Obra'}
                cancelText="Cancelar"
                variant={confirmState.actionType === 'delete' ? 'danger' : 'primary'}
            />
        </div>
    );
};
