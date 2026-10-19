import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export default defineConfig({
  root: path.resolve(projectRoot, 'client'),
  plugins: [react()],
  server: { hmr: false },
  build: { outDir: path.resolve(projectRoot, 'client/dist'), emptyOutDir: true }
});
