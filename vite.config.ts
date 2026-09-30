import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {spawn} from 'child_process';
import http from 'http';
import {defineConfig} from 'vite';

function ensureFastApiPlugin() {
  return {
    name: 'ensure-fastapi',
    configureServer() {
      const req = http.get('http://127.0.0.1:8005/health', (res) => {
        // already running
      });
      req.on('error', () => {
        console.log('[FastAPI] Launching backend server on port 8005...');
        try {
          const proc = spawn('python3', ['-m', 'uvicorn', 'backend.main:app', '--port', '8005', '--host', '127.0.0.1'], {
            stdio: 'ignore',
            detached: true,
          });
          proc.unref();
        } catch (err) {
          console.error('[FastAPI] Failed to spawn uvicorn:', err);
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), ensureFastApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8005',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  };
});
