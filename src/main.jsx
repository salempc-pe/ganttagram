import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { ErrorBoundary } from './shared/components/ErrorBoundary';
import { registerSW } from 'virtual:pwa-register';

// Registrar Service Worker para PWA
registerSW({ immediate: true });

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
