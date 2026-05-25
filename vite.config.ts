import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

function visualizerConsoleLog() {
  return {
    name: 'visualizer-console-log',
    closeBundle() {
      console.log('\x1b[32m%s\x1b[0m', '\n📊 Mapa de dependências gerado em stats.html');
      console.log('\x1b[36m%s\x1b[0m', '🔗 Abra o arquivo dist/stats.html ou stats.html (de acordo com a saída) no seu navegador para visualizar.');
    }
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      visualizer({ 
        open: false, 
        gzipSize: false, 
        brotliSize: false, 
        filename: 'stats.html' 
      }),
      visualizerConsoleLog()
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: false,
      ws: false,
    },
    build: {
      target: 'esnext',
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // 3D Dependencies
              if (id.includes('/node_modules/three/') || id.includes('/node_modules/@react-three/')) {
                return 'vendor-3d';
              }
              // Charts
              if (id.includes('/node_modules/recharts/') || id.includes('/node_modules/d3-')) {
                return 'vendor-charts';
              }
              // Core UI/React
              if (id.includes('/node_modules/react/') || id.includes('/node_modules/react-dom/') || id.includes('/node_modules/lucide-react/') || id.includes('/node_modules/motion/')) {
                return 'vendor-core';
              }
              // Everything else
              return 'vendor-misc';
            }
          }
        }
      }
    }
  };
});
