import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:8080', '/health': 'http://localhost:8080' } },
  build: {
    cssMinify: false,
    rollupOptions: {
      output: {
        entryFileNames: 'app.js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: asset => asset.names?.some(name => name.endsWith('.css'))
          ? 'styles.css' : 'assets/[name]-[hash][extname]',
      },
    },
  },
  test: { environment: 'jsdom', restoreMocks: true },
});
