import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    // Inicializar estado revisando localStorage, por defecto 'light' como sugiere "Technical Blueprint"
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('ganttagram-theme');
        return savedTheme || 'light';
    });

    useEffect(() => {
        // Guardar theme e inyectarlo en el documento
        localStorage.setItem('ganttagram-theme', theme);
        document.documentElement.setAttribute('data-theme', theme);

        // Actualizar color de barra de estado móvil (theme-color) de forma dinámica
        const themeColors = document.querySelectorAll('meta[name="theme-color"]');
        const color = theme === 'dark' ? '#0f172a' : '#f8fafc';
        
        themeColors.forEach(meta => {
            meta.setAttribute('content', color);
        });
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
