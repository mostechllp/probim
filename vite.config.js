import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@admin': path.resolve(__dirname, './src/admin'),
      '@employee': path.resolve(__dirname, './src/employee'),
      '@shared': path.resolve(__dirname, './src/shared'),
    }
  },

  optimizeDeps: {
    include: ['leaflet']
  }
})