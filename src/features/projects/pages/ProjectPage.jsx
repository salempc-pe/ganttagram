import { useState, useEffect, lazy, Suspense } from 'react';
import { Calendar, Plus, Flag, ChevronLeft, AlertTriangle, X, List, Layout, Users, Settings, Database } from 'lucide-react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { isWorkingDay, adjustToWorkingDay, getWorkingDuration, addWorkingDays } from '../../../shared/utils/calendar';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase/config';
import { ProjectSidebar } from '../components/ProjectSidebar';
import { ProjectHeader } from '../components/ProjectHeader';
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
import { useTheme } from '../../../shared/context/ThemeContext';
import { useAuth } from '../../auth/AuthContext';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';
import './ProjectPage.css';

// Lazy Loaded Components
const GanttChart = lazy(() => import('../../gantt/components/GanttChart').then(module => ({ default: module.GanttChart })));
const ProjectBoard = lazy(() => import('../components/ProjectBoard').then(module => ({ default: module.ProjectBoard })));
const TaskList = lazy(() => import('../components/TaskList').then(module => ({ default: module.TaskList })));
const ResourceList = lazy(() => import('../../resources/components/ResourceList').then(module => ({ default: module.ResourceList })));
const ProjectMembers = lazy(() => import('../components/ProjectMembers').then(module => ({ default: module.ProjectMembers })));
const CategoryManager = lazy(() => import('../components/CategoryManager').then(module => ({ default: module.CategoryManager })));
const CalendarSettings = lazy(() => import('../components/CalendarSettings').then(module => ({ default: module.CalendarSettings })));

export const ProjectPage = () => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const isDark = theme === 'dark';
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
    const [isConfirmDeleteProjectOpen, setIsConfirmDeleteProjectOpen] = useState(false);
    
    // Estado para ocultar cabecera/botones al hacer scroll en móvil en el Gantt
    const [isScrolled, setIsScrolled] = useState(false);

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
        try {
            if (editingTask) {
                const updatesMap = calculateAutoSchedule(
                    tasks,
                    dependencies,
                    editingTask.id,
                    { startDate: taskData.startDate, endDate: taskData.endDate },
                    milestones,
                    project.calendar
                );

                // Si calculateAutoSchedule no modificó la tarea porque las fechas no alteraron la cadena de dependencias,
                // AÚN NECESITAMOS guardar los datos (nombre, progreso, descripción, etc) de esta tarea.
                const scheduledDates = updatesMap[editingTask.id] || {};
                updatesMap[editingTask.id] = {
                    ...taskData,
                    ...scheduledDates,
                    startDate: scheduledDates.startDate || taskData.startDate,
                    endDate: scheduledDates.endDate || taskData.endDate
                };

                await applyBatchUpdates(updatesMap);
            } else {
                const result = await addTask(taskData);
                setIsTaskModalOpen(false);
                setEditingTask(null);
                return result;
            }
            setIsTaskModalOpen(false);
            setEditingTask(null);
        } catch (error) {
            console.error("Error in handleTaskSubmit:", error);
            alert("ProjectPage Submit Error: " + error.message);
        }
    };

    const applyBatchUpdates = async (updatesMap) => {
        try {
            const taskUpdates = {};
            const milestoneUpdates = {};

            Object.entries(updatesMap).forEach(([id, data]) => {
                const isMilestone = (milestones || []).some(m => m.id === id);
                if (isMilestone) {
                    milestoneUpdates[id] = data;
                } else {
                    taskUpdates[id] = data;
                }
            });

            if (Object.keys(taskUpdates).length > 0) {
                await updateTasksBatch(taskUpdates, dependencies, milestones, project.calendar);
            }

            // Si hay hitos afectados, los actualizamos uno a uno o añadimos batch a useMilestones
            for (const [id, data] of Object.entries(milestoneUpdates)) {
                await updateMilestone(id, data);
            }
        } catch (error) {
            console.error("Error in applyBatchUpdates:", error);
            alert("Unexpected applyBatchUpdates Error: " + error.message);
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
            const result = await addMilestone(milestoneData);
            setIsMilestoneModalOpen(false);
            setEditingMilestone(null);
            return result;
        }
        setIsMilestoneModalOpen(false);
        setEditingMilestone(null);
    };

    const handleEditMilestone = (milestone) => {
        setEditingMilestone(milestone);
        setIsMilestoneModalOpen(true);
    };

    const handleGanttDoubleClick = (item) => {
        // Solo bloquear el nodo raíz del proyecto (no las tareas padre)
        if (item.id === projectId) return;

        if (item.type === 'task' || item.type === 'project') {
            // Las tareas padre se renderizan como 'project' en el Gantt
            const task = tasks.find(t => t.id === item.id);
            if (task) handleEditTask(task);
        } else if (item.type === 'milestone') {
            const milestone = milestones.find(m => m.id === item.id);
            if (milestone) handleEditMilestone(milestone);
        }
    };

    const handleGanttTaskChange = async (task) => {
        try {
            // Bloquear el nodo raíz del proyecto y tareas padre (sus fechas son auto-calculadas)
            if (task.id === projectId) return;
            if (task._hasChildren) return;

            let rawStart = startOfDay(new Date(task.start));
            let rawEnd = endOfDay(new Date(task.end));
            let start = rawStart;
            let end = rawEnd;

            if (project.calendar) {
                const original = tasks.find(t => t.id === task.id) || milestones.find(m => m.id === task.id);
                if (original) {
                    // Fechas originales normalizadas
                    const origStart = startOfDay(original.startDate || original.date);
                    const origEnd = endOfDay(original.endDate || original.date);

                    // Buscar duración base (prioriza la escrita explicitamente por el usuario en el modal)
                    const storedDuration = parseInt(original.duration, 10);
                    let oldWorkingDuration = !isNaN(storedDuration) && storedDuration > 0
                        ? storedDuration
                        : getWorkingDuration(origStart, origEnd, project.calendar);

                    // Detectar si fue un movimiento evaluando si AMBAS esquinas cambiaron simultáneamente
                    // Si la librería aplasta o topa límites visuales, un resize es cuando solo un lado es manipulado
                    const startChanged = Math.abs(rawStart.getTime() - origStart.getTime()) > (1000 * 60 * 1); // tolerancia 1 min
                    const endChanged = Math.abs(rawEnd.getTime() - origEnd.getTime()) > (1000 * 60 * 1);
                    const isDragMove = startChanged && endChanged;

                    // Ajustar inicio si cae en día no laborable SIEMPRE
                    if (!isWorkingDay(start, project.calendar)) {
                        start = adjustToWorkingDay(start, project.calendar, 1);
                    }

                    if (isDragMove) {
                        // Si es un Drag&Drop puro, preservamos STRICTAMENTE la cantidad de días
                        end = endOfDay(addWorkingDays(start, oldWorkingDuration - 1, project.calendar));
                    } else {
                        // El usuario redimensionó la barra manualmente
                        // Restaurar borde no manipulado si existiese un pequeño desfase
                        if (!endChanged) end = origEnd;
                        if (!startChanged) start = origStart;

                        if (!isWorkingDay(end, project.calendar)) {
                            end = endOfDay(adjustToWorkingDay(end, project.calendar, -1));
                        }
                        if (end < start) {
                            end = endOfDay(start);
                        }

                        // Al redimensionar un proyecto, su nueva duración también cambia
                        // Idealmente se propagaría hasta original.duration
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

                // Recomputar duración explícita para sobreescribir DB en caso de un Resize
                if (updatesMap[task.id]) {
                    const updatedItem = updatesMap[task.id];
                    updatesMap[task.id].duration = getWorkingDuration(updatedItem.startDate, updatedItem.endDate, project.calendar).toString();
                }

                // Actualizar también tareas hijas o sucesoras arrastradas secundariamente
                Object.keys(updatesMap).forEach(key => {
                    if (key !== task.id && updatesMap[key].startDate && updatesMap[key].endDate) {
                        updatesMap[key].duration = getWorkingDuration(updatesMap[key].startDate, updatesMap[key].endDate, project.calendar).toString();
                    }
                });

                await applyBatchUpdates(updatesMap);
            }
        } catch (error) {
            console.error("Error in handleGanttTaskChange:", error);
            alert("Drag-and-Drop Gantt Error: " + error.message);
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

    if (loading) return <LoadingScreen text="Cargando proyecto..." />;
    if (!project) return <div className="flex justify-center p-8">Proyecto no encontrado</div>;

    return (
        <div className={`project-layout ${isScrolled && activeTab === 'gantt' ? 'is-scrolled' : ''}`}>
            <MobileHeader
                projectName={project.name}
                onMenuClick={() => setIsMenuOpen(!isMenuOpen)}
                showBack={true}
            />

            {isMenuOpen && (
                <div className="mobile-menu-overlay" onClick={() => setIsMenuOpen(false)}>
                    <div className="mobile-menu-content" onClick={e => e.stopPropagation()}>
                        <button className="btn-close-menu" onClick={() => setIsMenuOpen(false)}>
                            <X size={20} />
                        </button>

                        <div className="menu-header-pro" style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
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
                            <div className="py-4" style={{ paddingLeft: '1.5rem' }}>
                                <span className="menu-label-tech">Herramientas</span>
                            </div>

                            <button className={`menu-item ${activeTab === 'gantt' ? 'active' : ''}`} onClick={() => { setActiveTab('gantt'); setIsMenuOpen(false); }}>
                                <Layout size={20} /> <span>Gantt Chart</span>
                            </button>

                            <button className={`menu-item ${activeTab === 'list' ? 'active' : ''}`} onClick={() => { setActiveTab('list'); setIsMenuOpen(false); }}>
                                <List size={20} /> <span>Lista de Tareas</span>
                            </button>

                            <button className={`menu-item ${activeTab === 'board' ? 'active' : ''}`} onClick={() => { setActiveTab('board'); setIsMenuOpen(false); }}>
                                <Layout size={20} className="rotate-90" /> <span>Kanban</span>
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
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest text-center m-0">
                                Ganttagram Engineer
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="desktop-sidebar-container desktop-only">
                <ProjectSidebar activeTab={activeTab} onTabChange={setActiveTab} />
            </div>

            <main className="project-main">
                <ProjectHeader
                    project={project}
                    tasks={tasks}
                    resources={resources}
                    milestones={milestones}
                >
                    {activeTab === 'gantt' && (
                        <>
                            {/* Grupo izquierdo: View Selector */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {[
                                        { mode: ViewMode.Day, label: 'DÍA' },
                                        { mode: ViewMode.Week, label: 'SEMANA' },
                                        { mode: ViewMode.Month, label: 'MES' },
                                    ].map(({ mode, label }) => (
                                        <button
                                            key={label}
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: '8px',
                                                fontSize: '0.8rem',
                                                fontWeight: 700,
                                                letterSpacing: '0.06em',
                                                textTransform: 'uppercase',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s ease',
                                                border: 'none',
                                                fontFamily: 'var(--font-title)',
                                                ...(viewMode === mode
                                                    ? { backgroundColor: isDark ? '#1e293b' : '#e2e8f0', color: isDark ? '#e2e8f0' : '#0f172a' }
                                                    : { backgroundColor: 'transparent', color: '#64748b' }
                                                ),
                                            }}
                                            onClick={() => setViewMode(mode)}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Grupo derecho: Botones de acción */}
                            {canEdit && (
                                <div className="flex gap-3">
                                    <button
                                        className="btn-add-milestone whitespace-nowrap"
                                        onClick={() => { setEditingMilestone(null); setIsMilestoneModalOpen(true); }}
                                    >
                                        <Flag size={14} /> <span>Hito</span>
                                    </button>
                                    <button
                                        className="btn-add-task whitespace-nowrap"
                                        onClick={() => { setEditingTask(null); setIsTaskModalOpen(true); }}
                                    >
                                        <Plus size={14} /> <span>Tarea</span>
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </ProjectHeader>

                <div className="project-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Suspense fallback={<LoadingScreen />}>
                        {activeTab === 'gantt' && (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                {/* Mobile View Controls */}
                                <div
                                    className="mobile-only flex items-center justify-between p-2 overflow-x-auto shrink-0 mobile-view-controls"
                                    style={{
                                        background: 'var(--bg-primary)',
                                        borderBottom: '1px solid var(--border-color)'
                                    }}
                                >
                                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1">
                                        <button
                                            className="mobile-back-btn px-2 py-1 flex items-center justify-center bg-transparent border-none transition-colors mr-1 shrink-0"
                                            onClick={() => navigate('/dashboard')}
                                            style={{ color: 'var(--text-secondary)' }}
                                            aria-label="Volver"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        {[
                                            { mode: ViewMode.Day, label: 'DÍA' },
                                            { mode: ViewMode.Week, label: 'SEMANA' },
                                            { mode: ViewMode.Month, label: 'MES' },
                                        ].map(({ mode, label }) => (
                                            <button
                                                key={label}
                                                className="transition-colors whitespace-nowrap shrink-0"
                                                style={{
                                                    padding: '8px 16px',
                                                    borderRadius: '8px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 700,
                                                    letterSpacing: '0.06em',
                                                    textTransform: 'uppercase',
                                                    cursor: 'pointer',
                                                    border: 'none',
                                                    fontFamily: 'var(--font-title)',
                                                    backgroundColor: viewMode === mode ? 'var(--bg-tertiary)' : 'transparent',
                                                    color: viewMode === mode ? 'var(--text-primary)' : 'var(--text-tertiary)'
                                                }}
                                                onClick={() => setViewMode(mode)}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>

                                    {canEdit && (
                                        <div className="flex items-center gap-2 pl-2 shrink-0 ml-1">
                                            <button
                                                className="flex items-center justify-center p-0"
                                                onClick={() => { setEditingTask(null); setIsTaskModalOpen(true); }}
                                                style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    minWidth: '40px',
                                                    aspectRatio: '1/1',
                                                    borderRadius: '8px',
                                                    flexShrink: 0,
                                                    backgroundColor: '#334155',
                                                    border: 'none',
                                                    color: '#ffffff',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                                aria-label="Nueva Tarea"
                                            >
                                                <Plus size={24} style={{ color: '#ffffff', flexShrink: 0 }} />
                                            </button>
                                            <button
                                                className="flex items-center justify-center p-0"
                                                onClick={() => { setEditingMilestone(null); setIsMilestoneModalOpen(true); }}
                                                style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    minWidth: '40px',
                                                    aspectRatio: '1/1',
                                                    borderRadius: '8px',
                                                    flexShrink: 0,
                                                    backgroundColor: 'transparent',
                                                    border: '2px solid var(--accent-color)',
                                                    color: 'var(--accent-color)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                                aria-label="Nuevo Hito"
                                            >
                                                <Flag size={20} style={{ color: 'var(--accent-color)', flexShrink: 0 }} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <GanttChart
                                    projectId={projectId}
                                    viewMode={viewMode}
                                    onDoubleClick={handleGanttDoubleClick}
                                    onTaskChange={handleGanttTaskChange}
                                    readOnly={!canEdit}
                                    onScrollStateChange={setIsScrolled}
                                />
                            </div>
                        )}
                        {activeTab === 'list' && (
                            <div className="tab-container-scroll" style={{ padding: '1.5rem 1.5rem 4rem', display: 'flex', flexDirection: 'column' }}>
                                <TaskList
                                    projectId={projectId}
                                    onAddTask={() => { setEditingTask(null); setIsTaskModalOpen(true); }}
                                    onAddMilestone={() => { setEditingMilestone(null); setIsMilestoneModalOpen(true); }}
                                    onEditTask={handleEditTask}
                                    onEditMilestone={handleEditMilestone}
                                    dependencies={dependencies}
                                    milestones={milestones}
                                    projectCalendar={project.calendar}
                                    canEdit={canEdit}
                                />
                            </div>
                        )}
                        {activeTab === 'recursos' && (
                            <div className="animate-in flex flex-col gap-12 pb-12 tab-container-scroll" style={{ padding: '1.5rem 1.5rem 4rem' }}>
                                <ResourceList
                                    resources={resources}
                                    tasks={tasks}
                                    loading={resourcesLoading}
                                    onAdd={() => { setEditingResource(null); setIsResourceModalOpen(true); }}
                                    onEdit={handleEditResource}
                                    onDelete={handleDeleteResource}
                                    canEdit={canEdit}
                                />
                                <CategoryManager
                                    categories={categories}
                                    tasks={tasks}
                                    onAdd={addCategory}
                                    onUpdate={updateCategory}
                                    onDelete={deleteCategory}
                                    canEdit={canEdit}
                                />
                            </div>
                        )}
                        {activeTab === 'board' && (
                            <ProjectBoard
                                tasks={tasks}
                                dependencies={dependencies}
                                milestones={milestones}
                                onTaskUpdate={async (taskId, updates, deps, mstones) => {
                                    await updateTask(taskId, updates, deps, mstones, project.calendar);
                                }}
                                canEdit={canEdit}
                            />
                        )}
                        {activeTab === 'team' && (
                            <div className="tab-container-scroll" style={{ padding: '1.5rem 1.5rem 4rem', display: 'flex', flexDirection: 'column' }}>
                                <ProjectMembers projectId={projectId} />
                            </div>
                        )}
                        {activeTab === 'settings' && (
                            <div className="space-y-12 tab-container-scroll" style={{ padding: '1.5rem 1.5rem 8rem', display: 'flex', flexDirection: 'column' }}>
                                <section>
                                    <CalendarSettings
                                        calendar={project.calendar}
                                        onUpdate={handleCalendarUpdate}
                                        canEdit={canEdit}
                                    />
                                </section>

                                <section className="border-t border-slate-100 dark:border-slate-800" style={{ marginTop: '60px', paddingTop: '30px' }}>
                                    <div className="text-center" style={{ padding: '20px 0', marginBottom: '10px' }}>
                                        <h3 className="text-[11px] font-black uppercase tracking-[0.6em] text-slate-400" style={{ display: 'inline-block' }}>
                                            Zona de Control Crítico
                                        </h3>
                                    </div>

                                    <div className="relative" style={{ marginBottom: '2rem' }}>
                                        <div className="p-4 md:p-6 overflow-hidden">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="text-red-500">
                                                            <AlertTriangle size={18} strokeWidth={2.5} />
                                                        </div>
                                                        <h4 className="text-sm font-black uppercase tracking-tight text-primary" style={{ color: 'var(--text-primary)' }}>Eliminar Proyecto</h4>
                                                    </div>
                                                    <p className="text-xs text-secondary font-medium leading-relaxed" style={{ color: 'var(--text-secondary)', maxWidth: '600px' }}>
                                                        Esta es una acción <span className="text-red-500 font-bold">definitiva e irreversible</span>.
                                                        Se eliminarán todos los diagramas de Gantt, tareas, hitos, recursos y el historial de cambios permanentemente.
                                                    </p>
                                                </div>

                                                <div className="shrink-0 w-full md:w-auto">
                                                    <Button
                                                        variant="danger"
                                                        size="lg"
                                                        className="w-full md:w-auto font-black uppercase tracking-wider"
                                                        onClick={() => setIsConfirmDeleteProjectOpen(true)}
                                                        style={{ 
                                                            padding: '12px 24px', 
                                                            minWidth: '220px',
                                                            backgroundColor: '#ef4444',
                                                            color: 'white',
                                                            fontSize: '0.75rem',
                                                            border: 'none',
                                                            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)'
                                                        }}
                                                    >
                                                        Eliminar Proyecto
                                                    </Button>
                                                </div>
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
                    calendar={project.calendar}
                />

                <ResourceModal
                    isOpen={isResourceModalOpen}
                    onClose={() => { setIsResourceModalOpen(false); setEditingResource(null); }}
                    onSubmit={handleResourceSubmit}
                    initialData={editingResource}
                />

                <ConfirmModal
                    isOpen={isConfirmDeleteProjectOpen}
                    onClose={() => setIsConfirmDeleteProjectOpen(false)}
                    onConfirm={async () => {
                        const res = await deleteProject(projectId);
                        if (res.success) navigate('/dashboard');
                    }}
                    title="¿Eliminar Proyecto?"
                    message="¿Estás completamente seguro? Esta acción es definitiva y borrará todas las tareas, hitos, recursos y el historial de cambios permanentemente."
                    confirmText="Eliminar permanentemente"
                    variant="danger"
                />
            </main>
            <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
    );
};
