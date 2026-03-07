
import React, { useEffect, useRef } from 'react';
import './LoadingScreen.css';

export const LoadingScreen = ({ text = 'Cargando Ganttagram...' }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let time = 0;
        let animationFrameId;

        const drawBar = (x, y, width, height, radius, color) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.roundRect(x, y, width, height, radius);
            ctx.fill();
        };

        const animate = () => {
            // 1. Limpiar el lienzo (mantiene la transparencia)
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 2. Dibujar la grilla minimalista (desplazada 64px a la derecha)
            ctx.strokeStyle = "#2D2D35";
            ctx.lineWidth = 2;
            ctx.beginPath();

            const gridLinesVertical = [192, 320, 448]; // Antes: 128, 256, 384
            const gridLinesHorizontal = [128, 256, 384];

            // Líneas verticales
            gridLinesVertical.forEach(pos => {
                ctx.moveTo(pos, 0);
                ctx.lineTo(pos, canvas.height);
            });

            // Líneas horizontales
            gridLinesHorizontal.forEach(pos => {
                ctx.moveTo(0, pos);
                ctx.lineTo(canvas.width, pos);
            });
            ctx.stroke();

            // 3. Calcular el desplazamiento de cada barra
            const offsetRed = Math.sin(time) * 60;
            const offsetBlue = Math.sin(time + Math.PI / 2) * 60;
            const offsetGreen = Math.sin(time + Math.PI) * 60;

            // 4. Dibujar las barras (Posición X original + 64px + desplazamiento)
            drawBar(96 + offsetRed, 88, 320, 80, 40, "#F87171");
            drawBar(224 + offsetBlue, 216, 320, 80, 40, "#60A5FA");
            drawBar(160 + offsetGreen, 344, 320, 80, 40, "#4ADE80");

            // 5. Incrementar el tiempo
            time += 0.04;

            // 6. Solicitar el siguiente fotograma
            animationFrameId = requestAnimationFrame(animate);
        };

        // Iniciar la animación
        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div className="loading-screen-container">
            <canvas ref={canvasRef} id="loadingCanvas" width="640" height="512" className="loader-canvas"></canvas>
            <p className="loading-text">{text}</p>
        </div>
    );
};
