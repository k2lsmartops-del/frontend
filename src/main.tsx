import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { useAuthStore } from './common/stores/auth.store'
import { startSyncService, syncAllPending } from './lib/syncService'
import { getPendingCount } from './lib/submissionService'
import { cleanupOldData } from './lib/cleanupService'

useAuthStore.getState().hydrate()

// Rafraîchit le profil (zone, secteur, superviseur) depuis le serveur si connecté
useAuthStore.getState().refreshProfile()

// Nettoyage léger des fiches synced > 7 jours (non bloquant)
cleanupOldData()

// Demande de persistance du stockage (résiste aux purges automatiques, surtout iOS)
if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().then((granted) => {
    console.info(`[storage] persistance ${granted ? 'accordée' : 'refusée'}`)
  })
}
if (navigator.storage && navigator.storage.estimate) {
  navigator.storage.estimate().then((est) => {
    console.info('[storage] estimate', est)
  })
}

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

// ── Section 26 : iOS fallback sync (Background Sync API non supportée) ──
// Sur iOS, l'événement `online` ne se déclenche quasiment jamais en arrière-plan.
// On s'appuie donc sur `visibilitychange` et `focus` : quand l'utilisateur revient
// sur l'app, on relance la sync immédiatement s'il y a des fiches en attente.
async function wakeUpSync() {
  if (!navigator.onLine) return
  const pending = await getPendingCount()
  if (pending > 0) {
    console.info(`[sync] réveil app — ${pending} fiche(s) en attente → sync`)
    syncAllPending()
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') wakeUpSync()
})
window.addEventListener('focus', () => {
  wakeUpSync()
})
