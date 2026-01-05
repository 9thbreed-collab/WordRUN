import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5175,
    strictPort: true,
    host: true,
    hmr: { clientPort: 443 }
  },
  preview: {
    port: 4175,
    strictPort: true,
    host: true
  },
  build: { target: 'es2020' }
});
