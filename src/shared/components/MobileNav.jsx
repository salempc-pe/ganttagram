import {
    Layout,
    List,
    Calendar,
    Briefcase,
    Users,
    Settings
} from 'lucide-react';
import { clsx } from 'clsx';
import { useTheme } from '../context/ThemeContext';
import './MobileNav.css';

export const MobileNav = ({ activeTab, onTabChange }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const navItems = [
        { id: 'gantt', label: 'Gantt', icon: Calendar },
        { id: 'list', label: 'Lista', icon: List },
        { id: 'board', label: 'Kanban', icon: Layout },
        { id: 'recursos', label: 'Recursos', icon: Briefcase },
        { id: 'team', label: 'Equipo', icon: Users },
        { id: 'settings', label: 'Ajustes', icon: Settings },
    ];

    return (
        <nav
            className="mobile-nav"
            style={{
                background: 'var(--bg-card)',
                borderColor: 'var(--border-color)',
                boxShadow: 'var(--shadow-lg)',
                backdropFilter: 'blur(12px)'
            }}
        >
            {navItems.map(item => (
                <button
                    key={item.id}
                    className={clsx('mobile-nav-item', { active: activeTab === item.id })}
                    onClick={() => onTabChange(item.id)}
                    style={{
                        color: activeTab === item.id
                            ? 'var(--sidebar-active)'
                            : isDark ? '#64748b' : '#94a3b8'
                    }}
                >
                    <item.icon size={20} />
                    <span className="mobile-nav-label">{item.label}</span>
                </button>
            ))}
        </nav>
    );
};
