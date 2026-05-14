import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/websummit-hackathon/',
  plugins: [react()],
  server: {
    host: true,
  },
});
