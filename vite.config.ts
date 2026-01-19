import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // แยก vendor chunks ตาม node_modules
          if (id.includes('node_modules')) {
            if (id.includes('react-dom')) return 'vendor-react-dom';
            if (id.includes('react-router')) return 'vendor-react-router';
            if (id.includes('lucide-react')) return 'vendor-lucide';
            if (id.includes('react-hook-form')) return 'vendor-form';
            if (id.includes('zod')) return 'vendor-zod';
            if (id.includes('axios')) return 'vendor-axios';
            // Other vendors
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})

