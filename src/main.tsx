import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { useAuthStore } from './common/stores/auth.store'
import { startSyncService } from './lib/syncService'

useAuthStore.getState().hydrate()
startSyncService()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
