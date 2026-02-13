import { useState, useEffect, lazy, Suspense } from 'react';
import { Calendar, Plus, Flag, ChevronLeft, AlertTriangle, X, List, Layout, Users, Settings, Database } from 'lucide-react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { isWorkingDay, adjustToWorkingDay, getWorkingDuration, addWorkingDays } from '../../../shared/utils/calendar';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase/config';
import { ProjectSidebar } from '../components/ProjectSidebar';
import { TaskModal } from '../components/TaskModal';
import { MilestoneModal } from '../components/MilestoneModal';
import { ResourceModal } from '../../resources/components/ResourceModal';
import { Button } from '../../../shared/components/Button';
import { MobileHeader } from '../../../shared/components/MobileHeader';
import { MobileNav } from '../../../shared/components/MobileNav';
import { useTasks } from '../../tasks/hooks/useTasks';
import { useProjects } from '../hooks/useProjects';
import { useMilestones } from '../hooks/useMilestones';
import { useResources } from '../../resources/hooks/useResources';
import { useCategories } from '../hooks/useCategories';
import { calculateAutoSchedule } from '../../tasks/utils/scheduler';
import { useDependencies } from '../../tasks/hooks/useDependencies';
import { useProjectPermissions } from '../hooks/useProjectPermissions';
import { ViewMode } from 'gantt-task-react';
import { LoadingScreen } from '../../../shared/components/LoadingScreen';
import './ProjectPage.css';

// Lazy Loaded Components
const GanttChart = lazy(() => import('../../gantt/components/GanttChart').then(module => ({ default: module.GanttChart })));
const ProjectBoard = lazy(() => import('../components/ProjectBoard').then(module => ({ default: module.ProjectBoard })));
const TaskList = lazy(() => import('../components/TaskList').then(module => ({ default: module.TaskList })));
const ResourceList = lazy(() => import('../../resources/components/ResourceList').then(module => ({ default: module.ResourceList })));
const ProjectMembers = lazy(() => import('../components/ProjectMembers').then(module => ({ default: module.ProjectMembers })));
const CategoryManager = lazy(() => import('../components/CategoryManager').then(module => ({ default: module.CategoryManager })));
const CalendarSettings = lazy(() => import('../components/CalendarSettings').then(module => ({ default: module.CalendarSettings })));
import './ProjectPage.css';

export const ProjectPage = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('gantt');
    const [viewMode, setViewMode] = useState(ViewMode.Day);

    // Estados para modales
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
    const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
    const [editingResource, setEditingResource] = useState(null);
    const [editingTask, setEditingTask] = useState(null);
    const [editingMilestone, setEditingMilestone] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const { tasks, addTask, updateTask, updateTasksBatch } = useTasks(projectId);
    const { updateProject, deleteProject } = useProjects();
    const { milestones, addMilestone, updateMilestone } = useMilestones(projectId);
    const { dependencies } = useDependencies(projectId);
    const { resources, loading: resourcesLoading, addResource, updateResource, deleteResource } = useResources(projectId);
    const { categories, addCategory, updateCategory, deleteCategory } = useCategories(projectId);
    const { canEdit, isOwner } = useProjectPermissions(projectId);



    useEffect(() => {
        const fetchProject = async () => {
            try {
                const docRef = doc(db, 'projects', projectId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setProject({ id: docSnap.id, ...docSnap.data() });
                } else {
                    console.error("No such document!");
                }
            } catch (e) {
                console.error("Error fetching project: ", e);
            } finally {
                setLoading(false);
            }
        };

        if (projectId) {
            fetchProject();
        }
    }, [projectId]);

    const handleTaskSubmit = async (taskData) => {
        if (editingTask) {
            const updatesMap = calculateAutoSchedule(
                tasks,
                dependencies,
                editingTask.id,
                { startDate: taskData.startDate, endDate: taskData.endDate },
                milestones,
                project.calendar
            );

            // FIX: Ensure scheduler updates (dependencies) take precedence over manual dates
            // We combine taskData (name, etc) with updatesMap dates
            const scheduledDates = updatesMap[editingTask.id] || {};
            updatesMap[editingTask.id] = {
                ...taskData,
                ...scheduledDates,
                // Ensure we prefer the scheduler dates if they exist
                startDate: scheduledDates.startDate || taskData.startDate,
                endDate: scheduledDates.endDate || taskData.endDate
            };

            await applyBatchUpdates(updatesMap);
        } else {
            await addTask(taskData);
        }
        setIsTaskModalOpen(false);
        setEditingTask(null);
    };

    const applyBatchUpdates = async (updatesMap) => {
        const taskUpdates = {};
        const milestoneUpdates = {};

        Object.entries(updatesMap).forEach(([id, data]) => {
            const isMilestone = milestones.some(m => m.id === id);
            if (isMilestone) {
                milestoneUpdates[id] = data;
            } else {
                taskUpdates[id] = data;
            }
        });

        if (Object.keys(taskUpdates).length > 0) {
            await updateTasksBatch(taskUpdates);
        }

        // Si hay hitos afectados, los actualizamos uno a uno o añadimos batch a useMilestones
        for (const [id, data] of Object.entries(milestoneUpdates)) {
            await updateMilestone(id, data);
        }
    };

    const handleEditTask = (task) => {
        setEditingTask(task);
        setIsTaskModalOpen(true);
    };

    const handleMilestoneSubmit = async (milestoneData) => {
        if (editingMilestone) {
            const updatesMap = calculateAutoSchedule(
                tasks,
                dependencies,
                editingMilestone.id,
                { date: milestoneData.date },
                milestones,
                project.calendar
            );

            // FIX: Ensure scheduler updates take precedence
            const scheduledData = updatesMap[editingMilestone.id] || {};
            updatesMap[editingMilestone.id] = {
                ...milestoneData,
                ...scheduledData,
                date: scheduledData.date || milestoneData.date
            };

            await applyBatchUpdates(updatesMap);
        } else {
            await addMilestone(milestoneData);
        }
        setIsMilestoneModalOpen(false);
        setEditingMilestone(null);
    };

    const handleEditMilestone = (milestone) => {
        setEditingMilestone(milestone);
        setIsMilestoneModalOpen(true);
    };

    const handleGanttDoubleClick = (item) => {
        if (item.type === 'project') return;

        if (item.type === 'task') {
            const task = tasks.find(t => t.id === item.id);
            if (task) handleEditTask(task);
        } else if (item.type === 'milestone') {
            const milestone = milestones.find(m => m.id === item.id);
            if (milestone) handleEditMilestone(milestone);
        }
    };

    const handleGanttTaskChange = async (task) => {
        if (task.type === 'project') return;

        let start = startOfDay(new Date(task.start));
        let end = endOfDay(new Date(task.end));

        if (project.calendar) {
            const original = tasks.find(t => t.id === task.id) || milestones.find(m => m.id === task.id);
            if (original) {
                // Fechas originales normalizadas
                const origStart = original.startDate || original.date;
                const origEnd = original.endDate || original.date;

                const oldWorkingDuration = getWorkingDuration(origStart, origEnd, project.calendar);

                // Ajustar inicio si cae en día no laborable
                if (!isWorkingDay(start, project.calendar)) {
                    start = adjustToWorkingDay(start, project.calendar, 1);
                }

                // Detectar si fue un redimensionamiento (cambio intencional de duración) o movimiento
                // Calculamos la duración absoluta en días calendarios para comparar con la duración absoluta anterior
                const oldAbsDuration = Math.round((origEnd.getTime() - origStart.getTime()) / (1000 * 60 * 60 * 24));
                const newAbsDuration = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

                if (oldAbsDuration === newAbsDuration) {
                    // Si la duración absoluta es igual, el usuario solo arrastró el bloque.
                    // Preservamos la duración laborable original.
                    end = endOfDay(addWorkingDays(start, oldWorkingDuration - 1, project.calendar));
                } else {
                    // El usuario redimensionó la barra. Respetamos la nueva duración laborable.
                    // Pero aseguramos que el fin sea laborable.
                    if (!isWorkingDay(end, project.calendar)) {
                        end = endOfDay(adjustToWorkingDay(end, project.calendar, -1));
                    }
                }
            }
        }

        if (task.type === 'milestone') {
            const updatesMap = calculateAutoSchedule(
                tasks,
                dependencies,
                task.id,
                { date: start },
                milestones,
                project.calendar
            );
            await applyBatchUpdates(updatesMap);
        } else {
            const updatesMap = calculateAutoSchedule(
                tasks,
                dependencies,
                task.id,
                { startDate: start, endDate: end },
                milestones,
                project.calendar
            );
            await applyBatchUpdates(updatesMap);
        }
    };

    const handleCalendarUpdate = async (newCalendar) => {
        const res = await updateProject(projectId, { calendar: newCalendar });
        if (res.success) {
            setProject(prev => ({ ...prev, calendar: newCalendar }));
        }
    };

    const handleResourceSubmit = async (resourceData) => {
        if (editingResource) {
            await updateResource(editingResource.id, resourceData);
        } else {
            await addResource(resourceData);
        }
        setIsResourceModalOpen(false);
        setEditingResource(null);
    };

    const handleEditResource = (resource) => {
        setEditingResource(resource);
        setIsResourceModalOpen(true);
    };

    const handleDeleteResource = async (resourceId) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este recurso?')) {
            await deleteResource(resourceId);
        }
    };

    // Las categorías ahora se gestionan dentro de las tareas

    if (loading) return <LoadingScreen text="Cargando proyecto..." />;
    if (!project) return <div className="flex justify-center p-8">Proyecto no encontrado</div>;

    return (
        <div
            className="project-layout"
        >
            <MobileHeader
                projectName={project.name}
                onMenuClick={() => setIsMenuOpen(!isMenuOpen)}
                showBack={true}
            >
                {/* Indicador de pestaña actual en móvil */}
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold uppercase text-secondary">
                            Vista: {activeTab === 'recursos' ? 'Recursos' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-100">
                        <Calendar size={12} />
                        <span className="text-[10px] font-bold">
                            {format(new Date(), "d 'de' MMMM", { locale: es })}
                        </span>
                    </div>
                </div>
            </MobileHeader>

            {isMenuOpen && (
                <div className="mobile-menu-overlay" onClick={() => setIsMenuOpen(false)}>
                    <div className="mobile-menu-content" onClick={e => e.stopPropagation()}>
                        <button className="btn-close-menu" onClick={() => setIsMenuOpen(false)}>
                            <X size={20} />
                        </button>

                        <div className="menu-header-pro" style={{ paddingLeft: '2rem', paddingRight: '2rem' }}>
                            <span className="menu-label-tech">Control del Proyecto</span>
                            <div className="flex flex-col">
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight truncate">
                                    {project.name}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">En Curso</span>
                                </div>
                            </div>
                        </div>

                        <div className="menu-items-grid flex-1">
                            <div className="py-4" style={{ paddingLeft: '2rem' }}>
                                <span className="menu-label-tech">Herramientas</span>
                            </div>

                            <button className={`menu-item ${activeTab === 'gantt' ? 'active' : ''}`} onClick={() => { setActiveTab('gantt'); setIsMenuOpen(false); }}>
                                <Layout size={20} /> <span>Gantt Chart</span>
                            </button>

                            <button className={`menu-item ${activeTab === 'list' ? 'active' : ''}`} onClick={() => { setActiveTab('list'); setIsMenuOpen(false); }}>
                                <List size={20} /> <span>Lista de Tareas</span>
                            </button>

                            <button className={`menu-item ${activeTab === 'board' ? 'active' : ''}`} onClick={() => { setActiveTab('board'); setIsMenuOpen(false); }}>
                                <Layout size={20} className="rotate-90" /> <span>Tablero Kanban</span>
                            </button>

                            <button className={`menu-item ${activeTab === 'recursos' ? 'active' : ''}`} onClick={() => { setActiveTab('recursos'); setIsMenuOpen(false); }}>
                                <Database size={20} /> <span>Recursos Maestros</span>
                            </button>

                            <div className="h-px bg-slate-100 my-2 mx-6"></div>

                            <button className={`menu-item ${activeTab === 'team' ? 'active' : ''}`} onClick={() => { setActiveTab('team'); setIsMenuOpen(false); }}>
                                <Users size={20} /> <span>Equipo de Trabajo</span>
                            </button>

                            <button className={`menu-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => { setActiveTab('settings'); setIsMenuOpen(false); }}>
                                <Settings size={20} /> <span>Configuración</span>
                            </button>
                        </div>

                        <div className="menu-footer-pro">
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest text-center">
                                Ganttagram Engineer
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="hidden md:block">
                <ProjectSidebar activeTab={activeTab} onTabChange={setActiveTab} />
            </div>

            <main className="project-main">
                <header className="project-header hidden md:flex px-8 justify-between items-center bg-white border-b border-slate-200 h-20 shadow-sm z-30 relative">
                    <div className="flex items-center gap-6 pt-4">
                        <div className="h-10 w-1.5 bg-blue-600 rounded-full shadow-sm"></div>
                        <div className="flex flex-col justify-center">
                            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-800 leading-none">{project.name}</h1>
                            {project.description && <p className="text-xs text-slate-500 mt-1 font-bold tracking-wide uppercase opacity-60">{project.description}</p>}
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        {(activeTab === 'gantt' || activeTab === 'list' || activeTab === 'board') && (
                            <>
                                {activeTab === 'gantt' && (
                                    <div className="flex items-center gap-6">
                                        <div className="today-indicator">
                                            <Calendar size={14} strokeWidth={2.5} />
                                            <span className="whitespace-nowrap">
                                                T-DATA: {format(new Date(), "dd.MM.yyyy", { locale: es })}
                                            </span>
                                        </div>
                                        <div className="flex bg-slate-100 p-1 rounded border text-[10px] gap-1 font-bold">
                                            <button
                                                className={`view-selector-btn px-4 py-1.5 rounded ${viewMode === ViewMode.Day ? 'bg-white shadow-sm font-bold text-blue-700' : 'hover:bg-gray-200 text-gray-600'}`}
                                                onClick={() => setViewMode(ViewMode.Day)}
                                            >
                                                Día
                                            </button>
                                            <button
                                                className={`view-selector-btn px-4 py-1.5 rounded ${viewMode === ViewMode.Week ? 'bg-white shadow-sm font-bold text-blue-700' : 'hover:bg-gray-200 text-gray-600'}`}
                                                onClick={() => setViewMode(ViewMode.Week)}
                                            >
                                                Semana
                                            </button>
                                            <button
                                                className={`view-selector-btn px-4 py-1.5 rounded ${viewMode === ViewMode.Month ? 'bg-white shadow-sm font-bold text-blue-700' : 'hover:bg-gray-200 text-gray-600'}`}
                                                onClick={() => setViewMode(ViewMode.Month)}
                                            >
                                                Mes
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {canEdit && (
                                    <div className="flex gap-3 pl-6 border-l border-gray-200">
                                        <button
                                            className="btn-add-milestone"
                                            onClick={() => { setEditingMilestone(null); setIsMilestoneModalOpen(true); }}
                                        >
                                            <Flag size={14} /> Hito
                                        </button>
                                        <button
                                            className="btn-add-task"
                                            onClick={() => { setEditingTask(null); setIsTaskModalOpen(true); }}
                                        >
                                            <Plus size={14} /> Tarea
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </header>

                <div className="project-content">
                    <Suspense fallback={<LoadingScreen />}>
                        {activeTab === 'gantt' && (
                            <div className="flex flex-col h-full">
                                {/* Mobile View Controls - Sticky */}
                                <div className="md:hidden flex p-2 gap-2 overflow-x-auto bg-white border-b sticky top-0 z-10">
                                    <button
                                        className={`px-3 py-1 text-xs rounded-full whitespace-nowrap ${viewMode === ViewMode.Day ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                                        onClick={() => setViewMode(ViewMode.Day)}
                                    >
                                        Día
                                    </button>
                                    <button
                                        className={`px-3 py-1 text-xs rounded-full whitespace-nowrap ${viewMode === ViewMode.Week ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                                        onClick={() => setViewMode(ViewMode.Week)}
                                    >
                                        Semana
                                    </button>
                                    <button
                                        className={`px-3 py-1 text-xs rounded-full whitespace-nowrap ${viewMode === ViewMode.Month ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                                        onClick={() => setViewMode(ViewMode.Month)}
                                    >
                                        Mes
                                    </button>

                                    {/* Separador */}
                                    <div className="w-px bg-gray-300 mx-1"></div>

                                    {/* Botones de acción */}
                                    {canEdit && (
                                        <>
                                            <button
                                                className="px-3 py-1 text-xs rounded-full whitespace-nowrap bg-indigo-600 text-white"
                                                onClick={() => { setEditingTask(null); setIsTaskModalOpen(true); }}
                                            >
                                                + Tarea
                                            </button>
                                            <button
                                                className="px-3 py-1 text-xs rounded-full whitespace-nowrap bg-orange-500 text-white"
                                                onClick={() => { setEditingMilestone(null); setIsMilestoneModalOpen(true); }}
                                            >
                                                + Hito
                                            </button>
                                        </>
                                    )}
                                </div>
                                <GanttChart
                                    projectId={projectId}
                                    viewMode={viewMode}
                                    onDoubleClick={handleGanttDoubleClick}
                                    onTaskChange={handleGanttTaskChange}
                                    readOnly={!canEdit}
                                />
                            </div>
                        )}
                        {activeTab === 'list' && (
                            <TaskList
                                projectId={projectId}
                                onAddTask={() => { setEditingTask(null); setIsTaskModalOpen(true); }}
                                onAddMilestone={() => { setEditingMilestone(null); setIsMilestoneModalOpen(true); }}
                                onEditTask={handleEditTask}
                                onEditMilestone={handleEditMilestone}
                                canEdit={canEdit}
                            />
                        )}
                        {activeTab === 'recursos' && (
                            <div className="animate-in flex flex-col gap-12 pb-12">
                                <ResourceList
                                    resources={resources}
                                    loading={resourcesLoading}
                                    onAdd={() => { setEditingResource(null); setIsResourceModalOpen(true); }}
                                    onEdit={handleEditResource}
                                    onDelete={handleDeleteResource}
                                    canEdit={canEdit}
                                />
                                <div className="border-t pt-12">
                                    <CategoryManager
                                        categories={categories}
                                        onAdd={addCategory}
                                        onUpdate={updateCategory}
                                        onDelete={deleteCategory}
                                        canEdit={canEdit}
                                    />
                                </div>
                            </div>
                        )}
                        {activeTab === 'board' && (
                            <ProjectBoard
                                tasks={tasks}
                                dependencies={dependencies}
                                onTaskUpdate={async (taskId, updates) => {
                                    await updateTask(taskId, updates);
                                }}
                                canEdit={canEdit}
                            />
                        )}
                        {activeTab === 'team' && (
                            <ProjectMembers projectId={projectId} />
                        )}
                        {activeTab === 'settings' && (
                            <div className="p-4 space-y-12">
                                <section>
                                    <CalendarSettings
                                        calendar={project.calendar}
                                        onUpdate={handleCalendarUpdate}
                                        canEdit={canEdit}
                                    />
                                </section>

                                <section className="mt-12 border-t border-slate-100" style={{ marginTop: '60px', paddingTop: '30px' }}>
                                    <div className="text-center" style={{ padding: '20px 0', marginBottom: '20px' }}>
                                        <h3 className="text-[11px] font-black uppercase tracking-[0.6em] text-slate-300" style={{ display: 'inline-block' }}>
                                            Zona de Control Crítico
                                        </h3>
                                    </div>

                                    <div className="relative group">
                                        {/* Fondo decorativo de advertencia */}
                                        <div className="absolute -inset-1 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>

                                        <div className="relative p-8 bg-white border-2 border-red-100 rounded-3xl shadow-sm overflow-hidden">
                                            {/* Patrón de franjas de advertencia sutil */}
                                            <div className="absolute top-0 left-0 w-full h-1.5 bg-[repeating-linear-gradient(45deg,#fee2e2,#fee2e2_10px,#fff_10px,#fff_20px)]"></div>

                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                                                <div className="max-w-xl">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="p-1.5 bg-red-100 rounded-lg text-red-600">
                                                            <AlertTriangle size={20} strokeWidth={2.5} />
                                                        </div>
                                                        <h4 className="text-xl font-black uppercase tracking-tight text-slate-800">Eliminar Proyecto</h4>
                                                    </div>
                                                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                                        Esta es una acción <span className="text-red-600 font-bold underline decoration-2">definitiva e irreversible</span>.
                                                        Se eliminarán todos los diagramas de Gantt, tareas, hitos, recursos y el historial de cambios permanentemente.
                                                    </p>
                                                </div>

                                                {isOwner && (
                                                    <Button
                                                        variant="danger"
                                                        size="lg"
                                                        className="w-full md:w-auto font-black uppercase tracking-wider"
                                                        onClick={async () => {
                                                            if (window.confirm('¿ELIMINAR PROYECTO? Esta acción no se puede deshacer y se borrarán todas las tareas, hitos y recursos.')) {
                                                                const res = await deleteProject(projectId);
                                                                if (res.success) navigate('/dashboard');
                                                            }
                                                        }}
                                                    >
                                                        Eliminar permanentemente
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}
                    </Suspense>
                </div>

                <TaskModal
                    isOpen={isTaskModalOpen}
                    onClose={() => { setIsTaskModalOpen(false); setEditingTask(null); }}
                    onSubmit={handleTaskSubmit}
                    projectId={projectId}
                    initialData={editingTask}
                    calendar={project.calendar}
                />

                <MilestoneModal
                    isOpen={isMilestoneModalOpen}
                    onClose={() => { setIsMilestoneModalOpen(false); setEditingMilestone(null); }}
                    onSubmit={handleMilestoneSubmit}
                    projectId={projectId}
                    initialData={editingMilestone}
                />

                <ResourceModal
                    isOpen={isResourceModalOpen}
                    onClose={() => { setIsResourceModalOpen(false); setEditingResource(null); }}
                    onSubmit={handleResourceSubmit}
                    initialData={editingResource}
                />
            </main>
            <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
    );
};

