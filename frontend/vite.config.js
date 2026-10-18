import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Minimal Vite configuration for React SPA
 * Uses official @vitejs/plugin-react plugin.
 * Local development configuration defaults to port 5173.
 * No hardcoded credentials or secrets.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false
  }
});
