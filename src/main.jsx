import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { ErrorBoundary } from './shared/components/ErrorBoundary';
import { registerSW } from 'virtual:pwa-register';

// Registrar Service Worker para PWA con soporte de actualización automática
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('Nueva actualización detectada en la PWA. Recargando aplicación...');
    updateSW(true); // Activa el nuevo Service Worker y recarga la página
  }
});

// Forzar la comprobación de actualización de la PWA al iniciar (al menos una vez al día)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then((registration) => {
    const lastCheck = localStorage.getItem('ganttagram_last_sw_check');
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000; // 1 día en milisegundos

    if (!lastCheck || (now - parseInt(lastCheck)) > oneDay) {
      console.log('Iniciando verificación diaria de actualizaciones para la PWA...');
      registration.update().then(() => {
        localStorage.setItem('ganttagram_last_sw_check', now.toString());
      }).catch((err) => {
        console.error('No se pudo verificar la actualización del Service Worker:', err);
      });
    }
  });
}

// Manejar errores de carga de chunks (común después de un deploy)
window.addEventListener('vite:preloadError', (event) => {
  const lastReload = sessionStorage.getItem('last_preload_error_reload');
  const now = Date.now();

  // Si se recargó hace menos de 10 segundos, evitar loop infinito
  if (lastReload && now - parseInt(lastReload) < 10000) {
    console.error('Loop de recarga por error de precarga detectado. Deteniendo recarga automática.');

    // Intentar recuperar borrando Service Workers (posible caché corrupto)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (let registration of registrations) {
          registration.unregister();
        }
      });
    }
    return; // Dejar que el error se muestre para que el usuario sepa qué pasa
  }

  sessionStorage.setItem('last_preload_error_reload', now.toString());
  console.warn('Error de precarga de CSS detectado, recargando página...', event);
  event.preventDefault();
  window.location.reload(true);
});

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
