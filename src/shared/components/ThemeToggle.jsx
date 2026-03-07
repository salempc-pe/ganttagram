import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle = ({ className = '' }) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`flex items-center justify-center rounded-md p-2 transition-colors duration-200 
                hover:bg-opacity-20 hover:bg-white text-current ${className}`}
            aria-label="Toggle theme"
            title={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
        >
            {theme === 'dark' ? (
                <Sun size={20} className="text-yellow-400" />
            ) : (
                <Moon size={20} className="text-slate-700" />
            )}
        </button>
    );
};
