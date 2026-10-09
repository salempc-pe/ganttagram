import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { ProjectList } from '../projects/components/ProjectList';
import { Button } from '../../shared/components/Button';
import { useGlobalSummary } from './hooks/useGlobalSummary';
import { useProjects } from '../projects/hooks/useProjects';
import { LogOut, Calendar, AlertTriangle, ChevronRight, X, Building2, Activity, CheckCircle2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MobileHeader } from '../../shared/components/MobileHeader';
import { ThemeToggle } from '../../shared/components/ThemeToggle';
import './DashboardPage.css';

export const DashboardPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { milestones, criticalTasks, loading: globalLoading, error: globalError } = useGlobalSummary();
    const { projects } = useProjects();

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isMenuOpen) {
                setIsMenuOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isMenuOpen]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    if (globalError) {
        return (
            <div className="p-8 text-center">
                <p className="text-error mb-4">Error al cargar el resumen: {globalError}</p>
                <Button onClick={() => window.location.reload()}>Reintentar</Button>
            </div>
        );
    }

    const activeProjectsCount = projects ? projects.length : 0;
    const criticalCount = criticalTasks ? criticalTasks.length : 0;
    const milestonesCount = milestones ? milestones.length : 0;
    const avgProgress = projects && projects.length > 0
        ? Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / projects.length)
        : 0;

    return (
        <div className="app-layout pb-4 md:pb-0">
            <MobileHeader
                projectName="Ganttagram"
                showBack={false}
                onMenuClick={() => setIsMenuOpen(!isMenuOpen)}
                showThemeToggle={true}
            />

            {isMenuOpen && (
                <div
                    className="mobile-menu-overlay"
                    onClick={() => setIsMenuOpen(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Menú de usuario"
                >
                    <div className="mobile-menu-content" onClick={e => e.stopPropagation()}>
                        <button
                            className="btn-close-menu"
                            onClick={() => setIsMenuOpen(false)}
                            aria-label="Cerrar menú"
                        >
                            <X size={20} aria-hidden="true" />
                        </button>

                        <div className="menu-header-pro">
                            <span className="menu-label-tech">Perfil de Usuario</span>
                            <div className="flex items-center gap-4">
                                <div className="user-avatar-badge">
                                    {user?.displayName?.charAt(0) || 'U'}
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <p className="user-name-text">{user?.displayName}</p>
                                    <p className="user-email-text">{user?.email}</p>
                                </div>
                            </div>
                        </div>

                        <div className="menu-items-grid flex-1">
                            <div className="py-4 px-6">
                                <span className="menu-label-tech">Acciones</span>
                            </div>
                            <div className="mt-auto mb-2">
                                <button className="menu-item text-error" onClick={handleLogout}>
                                    <LogOut size={18} aria-hidden="true" />
                                    <span>Cerrar Sesión</span>
                                </button>
                            </div>
                        </div>

                        <div className="menu-footer-pro">
                            <p className="version-tag">
                                Ganttagram v2.5.0 • Technical Blueprint
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="sidebar hidden md:flex">
                <div className="sidebar-icon active" title="Centro de Mando">
                    <Link to="/dashboard" aria-label="Ir al Centro de Mando">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    </Link>
                </div>
            </div>

            <main className="main-content">
                <div className="dashboard-container">
                    <header className="hidden md:flex justify-between items-center mb-8">
                        <div>
                            <h1 className="dashboard-title">Centro de Mando</h1>
                            <p className="text-secondary">Bienvenido al sistema de gestión de proyectos, {user?.displayName}</p>
                        </div>
                        <div className="flex items-center gap-6">
                            <ThemeToggle />
                            <Button variant="ghost" onClick={handleLogout} className="btn-logout-header">
                                <LogOut size={18} aria-hidden="true" />
                                <span>SALIR</span>
                            </Button>
                        </div>
                    </header>

                    {/* Metric Tiles - Technical Blueprint Style */}
                    <div className="metrics-grid">
                        <div className="metric-tile tile-blueprint">
                            <div className="metric-header-row">
                                <span className="metric-label">Obras Activas</span>
                                <Building2 size={18} className="text-primary opacity-80" aria-hidden="true" />
                            </div>
                            <span className="metric-value font-tech">{activeProjectsCount}</span>
                            <span className="metric-trend">Proyectos registrados</span>
                        </div>

                        <div className="metric-tile tile-alert">
                            <div className="metric-header-row">
                                <span className="metric-label">Alertas Críticas</span>
                                <AlertTriangle size={18} className="text-error" aria-hidden="true" />
                            </div>
                            <span className="metric-value font-tech text-error">{criticalCount}</span>
                            <span className="metric-trend text-error">Partidas desviadas/por vencer</span>
                        </div>

                        <div className="metric-tile tile-milestone">
                            <div className="metric-header-row">
                                <span className="metric-label">Hitos 30 Días</span>
                                <Calendar size={18} className="text-accent" aria-hidden="true" />
                            </div>
                            <span className="metric-value font-tech">{milestonesCount}</span>
                            <span className="metric-trend">Entregables programados</span>
                        </div>

                        <div className="metric-tile tile-progress">
                            <div className="metric-header-row">
                                <span className="metric-label">Avance Promedio</span>
                                <Activity size={18} className="text-success" aria-hidden="true" />
                            </div>
                            <span className="metric-value font-tech">{avgProgress}%</span>
                            <span className="metric-trend">Ejecución ponderada</span>
                        </div>
                    </div>

                    {/* Dashboard Widgets */}
                    <div className="dashboard-grid">
                        {/* Próximos Hitos Globales */}
                        <div className="dashboard-card">
                            <div className="card-header">
                                <Calendar size={20} className="text-accent" aria-hidden="true" />
                                <h2 className="card-title">Hitos Próximos (30 días)</h2>
                            </div>
                            <div className="summary-list">
                                {globalLoading ? (
                                    <p className="empty-state">Cargando hitos...</p>
                                ) : milestones.length === 0 ? (
                                    <p className="empty-state">No hay hitos programados próximamente.</p>
                                ) : (
                                    milestones.slice(0, 5).map(ms => {
                                        const dateStr = ms.date instanceof Date ? format(ms.date, 'dd MMM', { locale: es }) : '--';
                                        return (
                                            <div key={ms.id} className="summary-item milestone">
                                                <div className="item-main">
                                                    <span className="item-name">{ms.name}</span>
                                                    <span className="badge font-tech">{dateStr}</span>
                                                </div>
                                                <div className="item-meta font-tech">
                                                    <span className="project-tag">{ms.projectName}</span>
                                                    <Link to={`/projects/${ms.projectId}`} className="text-accent flex items-center gap-1">
                                                        Ver <ChevronRight size={14} aria-hidden="true" />
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Alertas y Tareas Críticas */}
                        <div className="dashboard-card">
                            <div className="card-header">
                                <AlertTriangle size={20} className="text-error" aria-hidden="true" />
                                <h2 className="card-title">Alertas Críticas</h2>
                            </div>
                            <div className="summary-list">
                                {globalLoading ? (
                                    <p className="empty-state">Cargando alertas...</p>
                                ) : criticalTasks.length === 0 ? (
                                    <div className="empty-state flex items-center justify-center gap-2">
                                        <CheckCircle2 size={18} className="text-success" aria-hidden="true" />
                                        <span>¡Todo al día! No hay tareas críticas.</span>
                                    </div>
                                ) : (
                                    criticalTasks.slice(0, 5).map(task => {
                                        const endStr = task.endDate instanceof Date ? format(task.endDate, 'dd/MM') : '--';
                                        const isOverdue = task.endDate instanceof Date && task.endDate < new Date();
                                        return (
                                            <div key={task.id} className="summary-item overdue">
                                                <div className="item-main">
                                                    <span className="item-name">{task.name}</span>
                                                    <span className="text-error font-bold font-tech">{task.progress}%</span>
                                                </div>
                                                <div className="item-meta font-tech">
                                                    <span className="project-tag">{task.projectName}</span>
                                                    <span className={isOverdue ? 'text-error font-bold' : ''}>
                                                        Vence: {endStr}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    <section className="mt-8">
                        <ProjectList />
                    </section>
                </div>
            </main>
        </div>
    );
};
