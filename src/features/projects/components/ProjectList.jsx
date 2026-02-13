import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { ProjectCard } from './ProjectCard';
import { ProjectModal } from './ProjectModal';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { useNavigate } from 'react-router-dom';
import './ProjectList.css';

export const ProjectList = () => {
    const { projects, loading, error, createProject, deleteProject, duplicateProject } = useProjects();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const { updateProject } = useProjects(); // Asegurarse de tener updateProject

    // ... rest of the logic ... (I already have handleCreateProject etc from previous call but let's make it consistent)

    // Actually I'll just fix the render part and the state.

    // Let's do a cleaner replacement for the whole body of ProjectList to avoid confusion

    const handleCreateProject = async (projectData) => {
        if (editingProject) {
            const result = await updateProject(editingProject.id, projectData);
            if (result.success) {
                setEditingProject(null);
                setIsModalOpen(false);
            } else {
                alert('Error al actualizar proyecto: ' + result.error);
            }
            return;
        }

        const result = await createProject(projectData);
        if (result.success) {
            setIsModalOpen(false);
        } else {
            alert('Error al crear proyecto: ' + result.error);
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

    const handleDeleteProject = async (projectId) => {
        const result = await deleteProject(projectId);
        if (!result.success) {
            alert('Error al eliminar proyecto: ' + result.error);
        }
    };

    const handleDuplicateProject = async (projectId) => {
        const result = await duplicateProject(projectId);
        if (!result.success) {
            alert('Error al duplicar proyecto: ' + result.error);
        }
    };

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="loader-container"><div className="loader"></div></div>;
    if (error) return <div className="error-state">Error: {error}</div>;

    return (
        <div className="project-list-container">
            <div className="project-list-header flex justify-end">
                <Button onClick={() => setIsModalOpen(true)} className="w-full md:w-auto">
                    <Plus size={20} />
                    Nuevo Proyecto
                </Button>
            </div>

            {projects.length === 0 ? (
                <div className="empty-state">
                    <h3>No tienes proyectos aún</h3>
                    <p>Crea tu primer proyecto para comenzar a organizar tus tareas.</p>
                    <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                        Crear Proyecto
                    </Button>
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="empty-state">
                    <p>No se encontraron proyectos con "{searchTerm}"</p>
                </div>
            ) : (
                <div className="projects-grid">
                    {filteredProjects.map(project => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onOpen={(id) => navigate(`/projects/${id}`)}
                            onDelete={handleDeleteProject}
                            onDuplicate={handleDuplicateProject}
                            onEdit={() => handleEditProject(project)}
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
        </div>
    );
};
