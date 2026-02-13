import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Layout,
    List,
    Calendar as CalendarIcon,
    Settings,
    Users,
    ChevronLeft,
    ChevronRight,
    Briefcase,
    PanelLeftClose,
    PanelLeftOpen
} from 'lucide-react';
import { clsx } from 'clsx';
import './ProjectSidebar.css';

export const ProjectSidebar = ({ activeTab, onTabChange }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const menuItems = [
        { id: 'gantt', label: 'Cronograma', icon: CalendarIcon },
        { id: 'list', label: 'Lista de Tareas', icon: List },
        { id: 'recursos', label: 'Recursos', icon: Briefcase },
        { id: 'board', label: 'Tablero', icon: Layout }, // Futuro
        { id: 'team', label: 'Equipo', icon: Users },
        { id: 'settings', label: 'Configuración', icon: Settings },
    ];

    return (
        <div className={clsx('project-sidebar', { collapsed: isCollapsed })}>
            <div className="sidebar-header">
                <Link to="/dashboard" className="back-link">
                    <ChevronLeft size={20} />
                    {!isCollapsed && <span>Volver</span>}
                </Link>
                <button
                    className="sidebar-toggle"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    title={isCollapsed ? "Expandir" : "Colapsar"}
                >
                    {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
                </button>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map(item => (
                    <button
                        key={item.id}
                        className={clsx('nav-item', { active: activeTab === item.id })}
                        onClick={() => onTabChange(item.id)}
                        title={isCollapsed ? item.label : undefined}
                    >
                        <item.icon size={20} />
                        {!isCollapsed && <span>{item.label}</span>}
                    </button>
                ))}
            </nav>
        </div>
    );
};
