import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    // Inicializar estado revisando localStorage, por defecto 'dark' como sugiere "Industrial-Tech Premium"
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('ganttagram-theme');
        return savedTheme || 'dark';
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
