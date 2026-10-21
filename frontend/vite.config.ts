import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// The API lives in a separate NestJS service. In production nginx routes
// /api/* to it; in dev this proxy does the same job, so the browser only
// ever talks to one origin and the session cookie behaves identically.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:3100',
        changeOrigin: true,
      },
    },
  },
  build: { outDir: 'dist', sourcemap: false },
});
