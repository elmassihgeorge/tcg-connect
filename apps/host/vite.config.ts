import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react({
    jsxRuntime: 'automatic'
  })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    commonjsOptions: {
      include: ['@tcgconnect/shared']
    },
    rollupOptions: {
      external: (id) => {
        return false; // Don't externalize anything
      }
    }
  },
  optimizeDeps: {
    include: ['@tcgconnect/shared']
  }
})
