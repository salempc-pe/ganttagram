import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Ganttagram - Gestión de Proyectos',
        short_name: 'Ganttagram',
        description: 'Planificación y control de obras con diagramas de Gantt dinámicos.',
        theme_color: '#4f46e5',
        icons: [
          {
            src: 'app-icon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'app-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/analytics'],
          ui: ['lucide-react', 'gantt-task-react', 'date-fns', 'clsx']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    host: true, // Escuchar en todas las interfaces de red
    port: 3000,
    hmr: {
      overlay: false // Evitar que errores de HMR bloqueen la pantalla
    }
  }
})
