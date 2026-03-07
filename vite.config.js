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
        theme_color: '#ffffff',
        display: 'standalone',
        orientation: 'any',
        icons: [
          {
            src: 'app-icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'app-icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  build: {
    cssCodeSplit: false, // Desactivar división de CSS para evitar errores de precarga en móviles/redes lentas
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
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
  }
})
