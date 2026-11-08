import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' agar bisa di-deploy di subfolder (GitHub Pages, Netlify, dll.)
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { chunkSizeWarningLimit: 1500 },
})
