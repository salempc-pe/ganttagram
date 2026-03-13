import { Link } from 'react-router-dom';
import { Menu, ChevronLeft, Sun, Moon } from 'lucide-react';
import './MobileHeader.css';
import { useTheme } from '../context/ThemeContext';

export const MobileHeader = ({ projectName, onMenuClick, showBack = true, children, showThemeToggle = false, showTitle = true }) => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <header className={`mobile-header ${!showTitle ? 'no-title' : ''}`}>
            <div className="mobile-header-main">
                <div className="header-left">
                    {showBack && (
                        <Link to="/dashboard" className="mobile-back">
                            <ChevronLeft size={24} />
                        </Link>
                    )}
                    {showThemeToggle && (
                        <button
                            onClick={toggleTheme}
                            className="theme-toggle-btn"
                        >
                            {isDark ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                    )}
                </div>
                
                <div className="header-center">
                    {showTitle ? (
                        <h1 className="mobile-title">{projectName}</h1>
                    ) : (
                        children
                    )}
                </div>

                <div className="header-right">
                    <button className="mobile-menu-btn" onClick={onMenuClick}>
                        <Menu size={24} />
                    </button>
                </div>
            </div>
            {showTitle && children && <div className="mobile-header-extra">{children}</div>}
        </header>
    );
};
