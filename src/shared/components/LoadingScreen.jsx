
import React from 'react';
import './LoadingScreen.css';

export const LoadingScreen = ({ text = 'Cargando Ganttagram...' }) => {
    return (
        <div className="loading-screen-container">
            <div className="loader-wrapper">
                <img src="/app-icon.png" alt="Ganttagram" className="loader-icon" />
                <svg className="loader-radial" viewBox="0 0 100 100">
                    <circle
                        className="loader-radial-bg"
                        cx="50" cy="50" r="45"
                    />
                    <circle
                        className="loader-radial-progress"
                        cx="50" cy="50" r="45"
                    />
                </svg>
            </div>
            <p className="loading-text">{text}</p>
        </div>
    );
};
