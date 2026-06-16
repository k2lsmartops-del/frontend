import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/common/stores/auth.store';
import { useFilterStore } from '@/common/stores/filter.store';
import {
  RiHome5Line,
  RiFileList3Line,
  RiMapPinLine,
  RiLogoutBoxRLine,
  RiLeafLine,
} from 'react-icons/ri';

interface NavItem {
  to: string;
  icon: typeof RiHome5Line;
  label: string;
}

const clientNav: NavItem[] = [
  { to: '/client', icon: RiHome5Line, label: 'Tableau de bord' },
  { to: '/client/submissions', icon: RiFileList3Line, label: 'Soumissions' },
  { to: '/client/map', icon: RiMapPinLine, label: 'Carte temps reel' },
];

export default function ClientLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const location = useLocation();
  const navigate = useNavigate();
  const { period, setPeriod } = useFilterStore();

  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '??';

  const pageTitle = (() => {
    if (location.pathname === '/client') return 'Tableau de bord';
    if (location.pathname.includes('/submissions')) return 'Soumissions validees';
    if (location.pathname.includes('/map')) return 'Carte temps reel';
    if (location.pathname.includes('/reports')) return 'Rapports';
    return 'Portail Client';
  })();

  const pageSubtitle = (() => {
    if (location.pathname === '/client') return `${user?.fullName || 'Client'} - Activite du mois en cours`;
    if (location.pathname.includes('/submissions')) return 'Toutes les soumissions confirmees par K2L';
    if (location.pathname.includes('/map')) return 'Visualisation geographique des prospects et marchands';
    if (location.pathname.includes('/reports')) return 'Telechargez l\'activite au format PDF ou Excel';
    return '';
  })();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-k2l-gray-100">
      {/* Sidebar */}
      <aside className="flex h-full w-[230px] flex-shrink-0 flex-col bg-k2l-navy">
        <div className="flex items-center gap-2.5 border-b border-white/10 px-5 pb-4 pt-5">
          <div className="flex h-9 w-9 items-center justify-content-center rounded-lg bg-white/15 text-white">
            <RiLeafLine className="mx-auto text-lg" />
          </div>
          <div>
            <div className="font-head text-base font-bold text-white">K2L Terrain</div>
            <div className="text-[10px] text-white/60">Portail Client</div>
          </div>
        </div>

        <button
          onClick={() => navigate('/client/profile')}
          className="flex items-center gap-2.5 border-b border-white/10 px-5 py-3 w-full hover:bg-white/10 transition-colors cursor-pointer"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white font-head text-xs font-bold text-k2l-navy">
            {initials}
          </div>
          <div className="text-left">
            <div className="text-[13px] font-semibold text-white">{user?.fullName}</div>
            <div className="text-[10px] text-white/60">Acces lecture seule</div>
          </div>
        </button>

        <nav className="flex-1 overflow-y-auto px-3 py-2">
          {clientNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/client'}
              className={({ isActive }) =>
                `mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] transition-colors ${
                  isActive
                    ? 'bg-k2l-success font-semibold text-white shadow-md'
                    : 'text-white/75 hover:bg-white/8 hover:text-white'
                }`
              }
            >
              <item.icon className="text-[15px]" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={() => logout()}
          className="mx-3 mb-4 flex items-center gap-2 rounded-lg px-3 py-2.5 text-[13px] text-white/60 hover:bg-white/8 hover:text-white"
        >
          <RiLogoutBoxRLine className="text-[15px]" />
          Deconnexion
        </button>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between border-b border-k2l-gray-200 bg-white px-6 py-3.5 sticky top-0 z-10">
          <div>
            <h1 className="font-head text-[17px] font-semibold">{pageTitle}</h1>
            <p className="text-xs text-k2l-gray-400">{pageSubtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1 rounded-lg bg-k2l-gray-100 p-1">
              <button 
                onClick={() => setPeriod('today')}
                className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
                  period === 'today' 
                    ? 'bg-white font-semibold text-k2l-gray-800 shadow-sm' 
                    : 'text-k2l-gray-500 hover:bg-white/50'
                }`}
              >
                Aujourd'hui
              </button>
              <button 
                onClick={() => setPeriod('month')}
                className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
                  period === 'month' 
                    ? 'bg-white font-semibold text-k2l-gray-800 shadow-sm' 
                    : 'text-k2l-gray-500 hover:bg-white/50'
                }`}
              >
                Ce mois
              </button>
              <button 
                onClick={() => setPeriod('quarter')}
                className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
                  period === 'quarter' 
                    ? 'bg-white font-semibold text-k2l-gray-800 shadow-sm' 
                    : 'text-k2l-gray-500 hover:bg-white/50'
                }`}
              >
                Trimestre
              </button>
              <button 
                onClick={() => setPeriod('year')}
                className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
                  period === 'year' 
                    ? 'bg-white font-semibold text-k2l-gray-800 shadow-sm' 
                    : 'text-k2l-gray-500 hover:bg-white/50'
                }`}
              >
                Annee
              </button>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-k2l-success-light px-3 py-1.5 text-[11px] font-semibold text-k2l-success">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-k2l-success" />
              En direct
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
