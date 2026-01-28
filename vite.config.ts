import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@shared': path.resolve(__dirname, './src/components/shared'),
      '@services': path.resolve(__dirname, './src/services'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@project-types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@pr': path.resolve(__dirname, './src/pages/procurement/pr'),
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
            
            // React ecosystem: Core + UI libraries that depend on React
            // This prevents circular dependency between vendor-core and vendor-charts
            if (
              id.includes('react-dom') ||
              id.includes('node_modules/react/') ||
              id.includes('react-router') ||
              id.includes('scheduler') ||
              id.includes('recharts') ||      // Charts library (React-dependent)
              id.includes('lucide-react')     // Icons library (React-dependent)
            ) {
              return 'vendor-react';
            }
            
            // Form handling libraries (standalone, no React runtime dependency)
            if (id.includes('react-hook-form')) return 'vendor-form';
            
            // Validation library (standalone)
            if (id.includes('zod')) return 'vendor-zod';
            
            // HTTP client (standalone)
            if (id.includes('axios')) return 'vendor-axios';
            
            // TanStack Query (React-dependent but loaded separately for caching)
            if (id.includes('@tanstack/react-query')) return 'vendor-query';
            
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

