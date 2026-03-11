import { Link } from 'react-router-dom';
import { Menu, ChevronLeft, Sun, Moon } from 'lucide-react';
import './MobileHeader.css';
import { useTheme } from '../context/ThemeContext';

export const MobileHeader = ({ projectName, onMenuClick, showBack = true, children, showThemeToggle = false }) => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <header
            className="mobile-header"
            style={{
                background: 'var(--bg-primary)',
                borderBottom: '1px solid var(--border-color)',
                backdropFilter: 'blur(16px)'
            }}
        >
            <div className="mobile-header-top">
                {showBack && (
                    <Link to="/dashboard" className="mobile-back">
                        <ChevronLeft size={24} />
                    </Link>
                )}
                <h1 className="mobile-title">{projectName}</h1>
                <div className="flex items-center">
                    {showThemeToggle && (
                        <button
                            onClick={toggleTheme}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                gap: '8px'
                            }}
                        >
                            <Moon
                                size={18}
                                style={{
                                    color: isDark ? '#3b82f6' : '#94a3b8',
                                    opacity: isDark ? 1 : 0.4,
                                    transition: 'all 0.2s'
                                }}
                            />
                            <Sun
                                size={18}
                                style={{
                                    color: !isDark ? '#f59e0b' : '#94a3b8',
                                    opacity: !isDark ? 1 : 0.4,
                                    transition: 'all 0.2s'
                                }}
                            />
                        </button>
                    )}
                    <button className="mobile-menu-btn" onClick={onMenuClick}>
                        <Menu size={24} />
                    </button>
                </div>
            </div>
            {children && <div className="mobile-header-extra">{children}</div>}
        </header>
    );
};
