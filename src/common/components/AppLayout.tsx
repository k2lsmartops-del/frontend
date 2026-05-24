import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import Toast from './Toast';

export default function AppLayout() {
  return (
    <div className="mx-auto flex h-[100dvh] max-w-[430px] flex-col bg-k2l-gray-100 shadow-lg">
      {/* Zone de contenu scrollable */}
      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 overflow-y-auto overscroll-y-contain">
          <Outlet />
        </div>
      </div>
      {/* Navigation fixe en bas */}
      <BottomNav />
      <Toast />
    </div>
  );
}
