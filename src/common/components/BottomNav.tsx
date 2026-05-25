import { useLocation, useNavigate } from 'react-router-dom';
import {
  RiHome5Line, RiHome5Fill, RiUserLine, RiUserFill, RiStore2Line, RiStore2Fill,
  RiSettings4Line, RiSettings4Fill, RiCheckboxCircleLine, RiCheckboxCircleFill,
  RiTeamLine, RiTeamFill,
} from '@/common/icons';
import { useAuthStore } from '@/common/stores/auth.store';

// Navigation pour COMMERCIAL
const COMMERCIAL_NAV = [
  { path: '/', label: 'Accueil', icon: RiHome5Line, iconActive: RiHome5Fill },
  { path: '/prospect', label: 'Prospect', icon: RiUserLine, iconActive: RiUserFill },
  { path: '/marchand', label: 'Marchand', icon: RiStore2Line, iconActive: RiStore2Fill },
  { path: '/profile', label: 'Profil', icon: RiSettings4Line, iconActive: RiSettings4Fill },
];

// Navigation pour SUPERVISEUR
const SUPERVISOR_NAV = [
  { path: '/', label: 'Accueil', icon: RiHome5Line, iconActive: RiHome5Fill },
  { path: '/validation', label: 'À valider', icon: RiCheckboxCircleLine, iconActive: RiCheckboxCircleFill, badge: true },
  { path: '/team', label: 'Équipe', icon: RiTeamLine, iconActive: RiTeamFill },
  { path: '/profile', label: 'Profil', icon: RiSettings4Line, iconActive: RiSettings4Fill },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  // Sélectionner la navigation selon le rôle
  const navItems = user?.role === 'SUPERVISEUR' ? SUPERVISOR_NAV : COMMERCIAL_NAV;

  return (
    <nav
      aria-label="Navigation principale"
      className="flex shrink-0 border-t border-k2l-gray-200 bg-white"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}
    >
      {navItems.map((item) => {
        const active = location.pathname === item.path || 
          (item.path === '/validation' && location.pathname.startsWith('/validation'));
        const Icon = active ? item.iconActive : item.icon;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            aria-current={active ? 'page' : undefined}
            aria-label={item.label}
            className={`relative flex flex-1 flex-col items-center gap-1 pt-2.5 pb-1 font-body text-[10px] transition-colors ${
              active ? 'text-k2l-primary' : 'text-k2l-gray-400'
            }`}
          >
            <Icon className="text-[22px]" aria-hidden="true" />
            <span className="leading-none">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
