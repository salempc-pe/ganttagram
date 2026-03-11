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
