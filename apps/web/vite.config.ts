import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// NEUROATLAS_BASE permite publicar bajo un subdirectorio (p. ej. GitHub Pages: /NeuroAtlas/).
export default defineConfig({
  base: process.env.NEUROATLAS_BASE ?? '/',
  plugins: [react()],
  worker: { format: 'es' },
  build: {
    target: 'es2022',
    sourcemap: true,
    chunkSizeWarningLimit: 1200,
  },
  server: { port: 5173 },
  preview: { port: 4173 },
});
