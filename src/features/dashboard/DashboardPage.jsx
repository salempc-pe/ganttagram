import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { ProjectList } from '../projects/components/ProjectList';
import { useProjects } from '../projects/hooks/useProjects';
import { Button } from '../../shared/components/Button';
import { useGlobalSummary } from './hooks/useGlobalSummary';
import { LogOut, Calendar, AlertTriangle, ChevronRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MobileHeader } from '../../shared/components/MobileHeader';
import { MobileNav } from '../../shared/components/MobileNav';
import './DashboardPage.css';

export const DashboardPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { projects, loading: projectsLoading } = useProjects();
    const { milestones, criticalTasks, loading: globalLoading, error: globalError } = useGlobalSummary();

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

    return (
        <div className="app-layout pb-4 md:pb-0">
            <MobileHeader
                projectName="Ganttagram"
                showBack={false}
                onMenuClick={() => setIsMenuOpen(!isMenuOpen)}
            />

            {isMenuOpen && (
                <div className="mobile-menu-overlay" onClick={() => setIsMenuOpen(false)}>
                    <div className="mobile-menu-content" onClick={e => e.stopPropagation()}>
                        <button className="btn-close-menu" onClick={() => setIsMenuOpen(false)}>
                            <LogOut size={20} className="rotate-180" />
                        </button>

                        <div className="menu-header-pro" style={{ paddingLeft: '2rem', paddingRight: '2rem' }}>
                            <span className="menu-label-tech">Perfil de Usuario</span>
                            <div className="flex items-center gap-4">
                                <div
                                    className="rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
                                    style={{ width: '44px', height: '44px', backgroundColor: 'var(--primary-color)', flexShrink: 0 }}
                                >
                                    {user?.displayName?.charAt(0) || 'U'}
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <p className="font-bold text-slate-800 leading-tight truncate">{user?.displayName}</p>
                                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{user?.email}</p>
                                </div>
                            </div>
                        </div>

                        <div className="menu-items-grid flex-1">
                            <div className="py-4" style={{ paddingLeft: '2rem' }}>
                                <span className="menu-label-tech">Acciones</span>
                            </div>
                            <div className="px-2">
                                <button className="mobile-menu-item text-error mt-auto mb-4" onClick={handleLogout} style={{ paddingLeft: '1.5rem' }}>
                                    <LogOut size={18} />
                                    <span>Cerrar Sesión</span>
                                </button>
                            </div>
                        </div>

                        <div className="menu-footer-pro">
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest text-center">
                                Ganttagram v2.5.0
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="sidebar hidden md:flex">
                <div className="sidebar-icon active" title="Dashboard">
                    <Link to="/dashboard">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    </Link>
                </div>
            </div>

            <main className="main-content">
                <div className="dashboard-container">
                    <header className="hidden md:flex justify-between items-center mb-8">
                        <div>
                            <h1>Centro de Mando</h1>
                            <p className="text-secondary">Bienvenido al sistema de gestión de obras, {user?.displayName}</p>
                        </div>
                        <Button variant="ghost" onClick={handleLogout} className="text-error">
                            <LogOut size={18} />
                            <span className="ml-2">Salir</span>
                        </Button>
                    </header>

                    {/* Metric Tiles - Industrial Style */}


                    {/* Dashboard Widgets */}
                    <div className="dashboard-grid">
                        {/* Próximos Hitos Globales */}
                        <div className="dashboard-card">
                            <div className="card-header">
                                <Calendar size={20} className="text-accent" />
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
                                                    <span className="badge">{dateStr}</span>
                                                </div>
                                                <div className="item-meta">
                                                    <span className="project-tag">{ms.projectName}</span>
                                                    <Link to={`/projects/${ms.projectId}`} className="text-accent flex items-center">
                                                        Ver <ChevronRight size={14} />
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
                                <AlertTriangle size={20} className="text-error" />
                                <h2 className="card-title">Alertas Críticas</h2>
                            </div>
                            <div className="summary-list">
                                {globalLoading ? (
                                    <p className="empty-state">Cargando alertas...</p>
                                ) : criticalTasks.length === 0 ? (
                                    <p className="empty-state">¡Todo al día! No hay tareas críticas.</p>
                                ) : (
                                    criticalTasks.slice(0, 5).map(task => {
                                        const endStr = task.endDate instanceof Date ? format(task.endDate, 'dd/MM') : '--';
                                        const isOverdue = task.endDate instanceof Date && task.endDate < new Date();
                                        return (
                                            <div key={task.id} className="summary-item overdue">
                                                <div className="item-main">
                                                    <span className="item-name">{task.name}</span>
                                                    <span className="text-error font-bold">{task.progress}%</span>
                                                </div>
                                                <div className="item-meta">
                                                    <span className="project-tag">{task.projectName}</span>
                                                    <span className={isOverdue ? 'text-error' : ''}>
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
                        <h2 className="mb-4">Todos los Proyectos</h2>
                        <ProjectList />
                    </section>
                </div>
            </main>



        </div>
    );
};
