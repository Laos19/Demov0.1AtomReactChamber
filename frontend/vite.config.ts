import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// base relativa: el mismo build funciona en Render static y en GitHub Pages (/repo/app/).
// `npm run build:single` genera un dist/index.html autocontenido.
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'single' ? [viteSingleFile()] : [])],
  base: './',
  build: {
    chunkSizeWarningLimit: 700,
    // En modo single todo (incluidas las páginas diferidas) va dentro de un único index.html.
    ...(mode === 'single' ? { rollupOptions: { output: { inlineDynamicImports: true } }, assetsInlineLimit: 100_000_000 } : {}),
  },
}));
