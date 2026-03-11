import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import './ThemeToggle.css';

export const ThemeToggle = ({ className = '' }) => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div
            onClick={toggleTheme}
            className={`theme-toggle-container ${isDark ? 'dark' : 'light'} ${className}`}
            aria-label="Toggle theme"
            title={`Cambiar a modo ${isDark ? 'claro' : 'oscuro'}`}
        >
            <div className="theme-toggle-icons">
                <Sun size={14} className={`theme-toggle-icon sun ${!isDark ? 'active' : ''}`} />
                <Moon size={14} className={`theme-toggle-icon moon ${isDark ? 'active' : ''}`} />
            </div>
            <div className="theme-toggle-thumb">
                {isDark ? (
                    <Moon size={14} className="text-white fill-indigo-400" />
                ) : (
                    <Sun size={14} className="text-amber-500 fill-amber-200" />
                )}
            </div>
        </div>
    );
};
