import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const standaloneEntry = {
  name: 'standalone-entry',
  transformIndexHtml(html: string) {
    return html.replace('/client/src/index.tsx', '/src/index.tsx');
  },
};

/** Vite config for viewing the client without the NestJS server or platform runtime. */
export default defineConfig({
  root: path.resolve(__dirname, 'client'),
  define: {
    'process.env.CLIENT_BASE_PATH': JSON.stringify('/'),
  },
  plugins: [react(), standaloneEntry],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
      '@client': path.resolve(__dirname, 'client'),
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5174,
  },
});
