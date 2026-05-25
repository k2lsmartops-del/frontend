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

// ── Section 9 : Enregistrement du Service Worker ──
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('[SW] Registered:', registration.scope)
      })
      .catch((error) => {
        console.error('[SW] Registration failed:', error)
      })
  })
}

// ── Section 24 : Gestion ChunkLoadError (déploiement en cours) ──
window.addEventListener('error', (e) => {
  if (/ChunkLoadError|Loading chunk .* failed/.test(e.message || '')) {
    console.warn('[ChunkLoadError] Reloading...')
    window.location.reload()
  }
})

// ── Section 26 : iOS fallback sync (Background Sync non supporté) ──
window.addEventListener('online', () => {
  startSyncService()
})
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && navigator.onLine) {
    startSyncService()
  }
})
