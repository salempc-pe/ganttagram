import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { ErrorBoundary } from './shared/components/ErrorBoundary';
import { registerSW } from 'virtual:pwa-register';

// Registrar Service Worker para PWA (reactivado)
registerSW({ immediate: true });

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
