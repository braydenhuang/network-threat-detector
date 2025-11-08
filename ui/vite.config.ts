import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    solidPlugin(),
  ],
  server: {
    port: 3000,
    watch: {
      usePolling: true // Pick up on file changes when developing (new edits and save)
    }
  },
  build: {
    target: 'esnext',
  },
});