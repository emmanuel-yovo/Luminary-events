import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProduction = mode === 'production';

    return {
      plugins: [react()],
      define: {
        // In production, API calls go to same origin (empty string)
        // In development, they go to the local backend
        __API_BASE__: JSON.stringify(
          isProduction
            ? (env.VITE_API_BASE || '')
            : (env.VITE_API_BASE || 'http://localhost:3000')
        ),
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        outDir: 'dist',
        sourcemap: false,
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom', 'react-router-dom'],
              ui: ['sonner', 'lucide-react'],
              map: ['leaflet', 'react-leaflet'],
            }
          }
        }
      }
    };
});
