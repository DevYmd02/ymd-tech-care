import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
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
      "@pr": path.resolve(__dirname, './src/pages/procurement/pr'),
      "@customer": path.resolve(__dirname, './src/modules/master-data/customer'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
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
            // IMPORTANT: Do NOT separate React-dependent libraries into
            // different chunks from React core, as this causes circular
            // dependency warnings (vendor-core ↔ vendor-charts loop).
            //
            // Solution: Group React + all React-dependent UI libraries
            // (recharts, lucide-react) into a single vendor-react chunk.
            // ============================================================
            
            if (id.includes('lucide')) return 'vendor-icons';
            
            // React Core & UI Libraries (Grouping together to avoid circular dependencies)
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

            // Utilities and other large libs
            if (
              id.includes('axios') ||
              id.includes('zod') ||
              id.includes('@tanstack') ||
              id.includes('sweetalert2')
            ) {
              return 'vendor-utils';
            }
            
            // Let Vite/Rollup handle remaining vendors automatically
            // to avoid creating additional circular dependencies
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
})