import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        sidePanel: resolve(import.meta.dirname, 'index.html'),
        background: resolve(import.meta.dirname, 'src/background.ts'),
        recorder: resolve(import.meta.dirname, 'src/content/recorder.ts'),
      },
      output: {
        entryFileNames: 'assets/[name].js',
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
