import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function examStatusSyncPlugin(): Plugin {
  const sourcePath = 'C:\\Users\\visha\\Desktop\\FORM\\Exam_Status_Dashboard.html';
  const destPath = path.resolve(__dirname, 'public', 'Exam_Status_Dashboard.html');

  const doSync = () => {
    try {
      if (fs.existsSync(sourcePath)) {
        const srcStat = fs.statSync(sourcePath);
        let destStat = null;
        if (fs.existsSync(destPath)) {
          destStat = fs.statSync(destPath);
        }
        if (!destStat || srcStat.mtimeMs > destStat.mtimeMs || srcStat.size !== destStat.size) {
          fs.copyFileSync(sourcePath, destPath);
          console.log('[vite:exam-status] Synced Exam_Status_Dashboard.html from Desktop/FORM');
        }
      }
    } catch (e) {
      console.warn('[vite:exam-status] Sync failed:', e);
    }
  };

  return {
    name: 'exam-status-sync',
    buildStart() {
      doSync();
    },
    configureServer(server) {
      doSync();
      if (fs.existsSync(sourcePath)) {
        server.watcher.add(sourcePath);
        server.watcher.on('change', (changedPath) => {
          if (path.resolve(changedPath) === path.resolve(sourcePath)) {
            doSync();
            server.ws.send({ type: 'full-reload' });
          }
        });
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), examStatusSyncPlugin()],
  base: './', // Universal relative base for GitHub Pages project hosting
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  test: {
    globals: true,
    environment: 'node',
  },
});
