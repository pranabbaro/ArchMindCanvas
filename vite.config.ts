import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // For GitHub project pages, set VITE_BASE_PATH to /YOUR-REPO-NAME/
  // Example: VITE_BASE_PATH=/ArchMindCanvas/
  base: process.env.VITE_BASE_PATH || '/',
});
