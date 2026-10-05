import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: './',
  plugins: [react()],
  resolve: {
    alias: { 'react-island-toast': fileURLToPath(new URL('../src/index.ts', import.meta.url)) },
  },
  server: { port: 8097 },
});
