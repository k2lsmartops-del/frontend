import { useLocation, useNavigate } from 'react-router-dom';
import {
  RiHome5Line, RiHome5Fill, RiUserLine, RiUserFill, RiStore2Line, RiStore2Fill,
  RiSettings4Line, RiSettings4Fill, RiTeamLine, RiTeamFill,
} from '@/common/icons';
import { useAuthStore } from '@/common/stores/auth.store';

// Navigation pour COMMERCIAL
const COMMERCIAL_NAV = [
  { path: '/', label: 'Accueil', icon: RiHome5Line, iconActive: RiHome5Fill, disabled: false },
  { path: '/prospect', label: 'Prospect', icon: RiUserLine, iconActive: RiUserFill, disabled: false },
  { path: '/marchand', label: 'Marchand', icon: RiStore2Line, iconActive: RiStore2Fill, disabled: true },
  { path: '/profile', label: 'Profil', icon: RiSettings4Line, iconActive: RiSettings4Fill, disabled: false },
];

// Navigation pour SUPERVISEUR
const SUPERVISOR_NAV = [
  { path: '/', label: 'Accueil', icon: RiHome5Line, iconActive: RiHome5Fill },
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
        const isDisabled = 'disabled' in item ? Boolean(item.disabled) : false;
        return (
          <button
            key={item.path}
            onClick={() => !isDisabled && navigate(item.path)}
            disabled={isDisabled}
            aria-current={active ? 'page' : undefined}
            aria-label={item.label}
            className={`relative flex flex-1 flex-col items-center gap-1 pt-2.5 pb-1 font-body text-[10px] transition-colors ${
              isDisabled ? 'text-k2l-gray-300 opacity-50 cursor-not-allowed' : active ? 'text-k2l-primary' : 'text-k2l-gray-400'
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
