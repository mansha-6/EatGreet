import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'leaflet/dist/leaflet.css'
import App from './App.jsx'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { SettingsProvider } from './context/SettingsContext'
import { SocketProvider } from './context/SocketContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <SocketProvider>
          <App />
        </SocketProvider>
      </SettingsProvider>
    </QueryClientProvider>
  </StrictMode>,
)
