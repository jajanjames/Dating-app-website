import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const apiBaseUrl = (
    env.VITE_API_BASE_URL ||
    process.env.VITE_API_BASE_URL ||
    env.API_BASE_URL ||
    process.env.API_BASE_URL ||
    'https://naam.gredin.app'
  )
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\/+$/, '')
    .replace(/\/users$/, '');

  const proxyConfig = {
    '/api/users': {
      target: apiBaseUrl,
      changeOrigin: true,
      rewrite: (p: string) => p.replace(/^\/api\/users/, '/users'),
    },
  };

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(apiBaseUrl),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          privacy: path.resolve(__dirname, 'privacy.html'),
          terms: path.resolve(__dirname, 'terms.html'),
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: proxyConfig,
    },
    preview: {
      proxy: proxyConfig,
    },
  };
});
