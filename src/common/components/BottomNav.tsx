import { useLocation, useNavigate } from 'react-router-dom';
import { RiHome5Line, RiHome5Fill, RiUserLine, RiUserFill, RiStore2Line, RiStore2Fill, RiFileList3Line, RiFileList3Fill } from '@/common/icons';

const NAV_ITEMS = [
  { path: '/', label: 'Accueil', icon: RiHome5Line, iconActive: RiHome5Fill },
  { path: '/prospect', label: 'Prospect', icon: RiUserLine, iconActive: RiUserFill },
  { path: '/marchand', label: 'Marchand', icon: RiStore2Line, iconActive: RiStore2Fill },
  { path: '/history', label: 'Historique', icon: RiFileList3Line, iconActive: RiFileList3Fill },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="flex shrink-0 border-t border-k2l-gray-200 bg-white pt-2 pb-2" style={{ paddingBottom: 'calc(8px + env(safe-area-inset-bottom))' }}>
      {NAV_ITEMS.map((item) => {
        const active = location.pathname === item.path;
        const Icon = active ? item.iconActive : item.icon;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-1.5 font-body text-[10px] transition-colors ${
              active ? 'text-k2l-primary' : 'text-k2l-gray-400'
            }`}
          >
            <Icon className="text-[22px]" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
