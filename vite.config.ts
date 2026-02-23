import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all envs regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      visualizer({
        open: false,
        filename: 'stats.html',
        gzipSize: true,
        brotliSize: true,
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/shared/components'),
        '@shared': path.resolve(__dirname, './src/shared'),
        '@layout': path.resolve(__dirname, './src/shared/components/ui/layout'),
        '@system': path.resolve(__dirname, './src/shared/components/system'),
        '@ui': path.resolve(__dirname, './src/shared/components/ui'),
        '@services': path.resolve(__dirname, './src/services'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@project-types': path.resolve(__dirname, './src/types'),
        '@utils': path.resolve(__dirname, './src/utils'),
        "@pr": path.resolve(__dirname, './src/modules/procurement/pages/pr'),
        "@rfq": path.resolve(__dirname, './src/modules/procurement/pages/rfq'),
        "@auth": path.resolve(__dirname, './src/modules/auth'),
        "@master-data": path.resolve(__dirname, './src/modules/master-data'),
        "@customer": path.resolve(__dirname, './src/modules/master-data/customer'),
        "@currency": path.resolve(__dirname, './src/modules/master-data/currency'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // ============================================================
              // VENDOR CHUNKING STRATEGY
              // ============================================================
              if (id.includes('lucide')) return 'vendor-icons';
              
              if (
                id.includes('node_modules/react/') || 
                id.includes('node_modules/react-dom/') || 
                id.includes('node_modules/react-router/') ||
                id.includes('node_modules/react-router-dom/') ||
                id.includes('node_modules/scheduler/') ||
                id.includes('recharts')
              ) {
                return 'vendor-react';
              }

              if (
                id.includes('axios') ||
                id.includes('zod') ||
                id.includes('@tanstack') ||
                id.includes('sweetalert2')
              ) {
                return 'vendor-utils';
              }
            }
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
    },
  };
});
