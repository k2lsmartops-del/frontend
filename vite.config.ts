import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { copyFileSync, existsSync } from 'fs'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    // Section 14 : copie le service-worker.js à la racine de dist/ au build
    {
      name: 'copy-service-worker',
      closeBundle() {
        const src = path.resolve(process.cwd(), 'public/service-worker.js')
        const dest = path.resolve(process.cwd(), 'dist/service-worker.js')
        if (existsSync(src)) {
          copyFileSync(src, dest)
        }
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) {
            return 'react-vendor'
          }
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
})
