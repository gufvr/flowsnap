import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: false,
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      input: resolve(import.meta.dirname, 'src/content/recorder.ts'),
      output: {
        format: 'iife',
        entryFileNames: 'assets/recorder.js',
        name: 'FlowSnapRecorder',
      },
    },
  },
});
