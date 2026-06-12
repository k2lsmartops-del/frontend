import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import Toast from './Toast';
import SyncBadge from './SyncBadge';
import StoragePurgeWarning from './StoragePurgeWarning';
import SyncToastListener from './SyncToastListener';
import { useAuthStore } from '@/common/stores/auth.store';

export default function AppLayout() {
  const role = useAuthStore((s) => s.user?.role);
  // Le badge de sync ne concerne que le commercial (créateur de soumissions offline)
  const showSync = role === 'COMMERCIAL';

  return (
    <div className="mx-auto flex min-h-screen max-w-[430px] flex-col bg-white shadow-lg">
      {/* Écoute les événements de sync pour afficher les toasts */}
      <SyncToastListener />

      {/* Badge de synchronisation + bandeau anti-purge (commercial uniquement) */}
      {showSync && (
        <div className="shrink-0">
          <SyncBadge />
          <StoragePurgeWarning />
        </div>
      )}

      {/* Zone de contenu avec padding pour la nav fixe */}
      <main className="flex-1 bg-k2l-gray-100 pb-20">
        <Outlet />
      </main>

      {/* Navigation fixe en bas */}
      <BottomNav />
      <Toast />
    </div>
  );
}
