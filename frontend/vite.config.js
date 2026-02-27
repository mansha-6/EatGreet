import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    host: true, // Listen on all local IPs
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  optimizeDeps: {
    include: ['three', 'react-is'],
  },
  build: {
    rollupOptions: {
      external: [],
    },
    commonjsOptions: {
      include: [/three/, /react-is/, /node_modules/],
    },
  },
})
