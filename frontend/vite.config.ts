import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    // FIX: Changed from 3000 to 5173 to match CORS allowlist and project spec
    port: 5173,
    strictPort: true,
  },
});
