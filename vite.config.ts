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
        '@core': path.resolve(__dirname, './src/core'),
        '@shared': path.resolve(__dirname, './src/shared'),
        '@components': path.resolve(__dirname, './src/shared/components'),
        '@ui': path.resolve(__dirname, './src/shared/components/ui'),
        '@layout': path.resolve(__dirname, './src/shared/components/ui/layout'),
        '@system': path.resolve(__dirname, './src/shared/components/system'),
        "@hooks": path.resolve(__dirname, './src/shared/hooks'),
        '@services': path.resolve(__dirname, './src/services'),
        '@utils': path.resolve(__dirname, './src/shared/utils'),
        '@project-types': path.resolve(__dirname, './src/types'),
        
        /* Module Aliases */
        '@auth': path.resolve(__dirname, './src/modules/auth'),
        '@sales': path.resolve(__dirname, './src/modules/sales'),
        '@procurement': path.resolve(__dirname, './src/modules/procurement'),
        '@pr': path.resolve(__dirname, './src/modules/procurement/pages/pr'),
        '@rfq': path.resolve(__dirname, './src/modules/procurement/pages/rfq'),
        '@master-data': path.resolve(__dirname, './src/modules/master-data'),
        '@customer': path.resolve(__dirname, './src/modules/master-data/customer'),
        '@inventory': path.resolve(__dirname, './src/modules/master-data/inventory'),
        '@currency': path.resolve(__dirname, './src/modules/master-data/currency'),
        '@company': path.resolve(__dirname, './src/modules/master-data/company'),
        '@sales-master': path.resolve(__dirname, './src/modules/master-data/sales'),
      },
    },
    server: {
      host: true,
      port: 5173,
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
              // VENDOR CHUNKING STRATEGY - Optimized for ERP Scale
              // ============================================================
              
              // 1. Core Framework & Visuals (Merged to prevent circular chunks)
              if (
                id.includes('react') || 
                id.includes('react-dom') || 
                id.includes('react-router') ||
                id.includes('recharts')
              ) {
                return 'vendor-main';
              }
              
              // 2. Icons
              if (id.includes('lucide')) return 'vendor-icons';
              
              // 3. Forms & Validation
              if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
                return 'vendor-forms';
              }

              // 4. Data Fetching & Table
              if (id.includes('@tanstack/react-query')) return 'vendor-query';
              if (id.includes('@tanstack/react-table')) return 'vendor-table';

              // 5. Utilities
              if (id.includes('axios') || id.includes('date-fns')) {
                return 'vendor-utils';
              }
              
              // 6. Other large libs
              if (id.includes('sweetalert2') || id.includes('react-hot-toast')) {
                return 'vendor-ui-extra';
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
