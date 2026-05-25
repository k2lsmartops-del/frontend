import { useState, useEffect } from 'react';

/**
 * Hook de détection des mises à jour du Service Worker.
 * Affiche un état "updateAvailable" quand un nouveau SW est installé et en attente.
 * L'utilisateur décide quand appliquer la mise à jour (section 17 du guide).
 */
export function useServiceWorkerUpdate() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.ready.then((registration) => {
      // CAS 1 : un SW attend déjà au chargement
      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
        setUpdateAvailable(true);
      }

      // Vérifie l'existence d'une mise à jour toutes les heures
      const interval = setInterval(() => registration.update(), 60 * 60 * 1000);

      // CAS 2 : un nouveau SW commence à s'installer pendant la session
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          // "installed" + un contrôleur existe déjà = c'est une MISE À JOUR
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingWorker(newWorker);
            setUpdateAvailable(true);
          }
        });
      });

      return () => clearInterval(interval);
    });

    // Quand le nouveau SW prend le contrôle, recharge UNE seule fois
    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  // Appelée quand l'utilisateur clique "Mettre à jour"
  const applyUpdate = () => {
    if (!waitingWorker) return;
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    setUpdateAvailable(false);
  };

  return { updateAvailable, applyUpdate };
}
