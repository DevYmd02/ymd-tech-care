import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Core libs: React + Router (รวมกันเพื่อแก้ circular dependency)
            if (
              id.includes('react-dom') || 
              id.includes('node_modules/react/') || 
              id.includes('react-router') || 
              id.includes('scheduler')
            ) {
              return 'vendor-core';
            }
            
            if (id.includes('lucide-react')) return 'vendor-lucide';
            if (id.includes('react-hook-form')) return 'vendor-form';
            if (id.includes('zod')) return 'vendor-zod';
            if (id.includes('axios')) return 'vendor-axios';
            if (id.includes('recharts')) return 'vendor-charts';
            
            // Other vendors - Let Vite/Rollup handle them to avoid circular dependencies
            // return 'vendor';
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

