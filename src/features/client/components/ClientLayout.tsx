import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/common/stores/auth.store';
import { useFilterStore } from '@/common/stores/filter.store';
import { useClientTheme, useTheme } from '@/common/contexts/ThemeContext';
import {
  RiHome5Line,
  RiFileList3Line,
  RiMapPinLine,
  RiLogoutBoxRLine,
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
  const { theme } = useTheme();
  
  // Appliquer le thème client (Mansa Banque par défaut)
  useClientTheme();

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
    <div className="flex h-screen w-full overflow-hidden" style={{ backgroundColor: 'var(--color-theme-background)' }}>
      {/* Sidebar avec couleurs du thème */}
      <aside 
        className="flex h-full w-[230px] flex-shrink-0 flex-col"
        style={{ backgroundColor: 'var(--color-theme-primary-dark)' }}
      >
        {/* Logo et nom de l'entreprise */}
        <div className="flex items-center gap-2.5 border-b border-white/10 px-5 pb-4 pt-5">
          <div 
            className="flex h-10 w-10 items-center justify-center rounded-lg overflow-hidden"
            style={{ backgroundColor: 'var(--color-theme-primary)' }}
          >
            {theme.logo ? (
              <img src={theme.logo} alt={theme.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-white font-bold text-lg">{theme.name.charAt(0)}</span>
            )}
          </div>
          <div>
            <div className="font-head text-base font-bold text-white">{theme.name}</div>
            <div className="text-[10px] text-white/60">Portail Client</div>
          </div>
        </div>

        {/* Profil utilisateur */}
        <button
          onClick={() => navigate('/client/profile')}
          className="flex items-center gap-2.5 border-b border-white/10 px-5 py-3 w-full hover:bg-white/10 transition-colors cursor-pointer"
        >
          <div 
            className="flex h-9 w-9 items-center justify-center rounded-lg font-head text-xs font-bold"
            style={{ 
              backgroundColor: 'var(--color-theme-primary)',
              color: 'var(--color-theme-primary-dark)'
            }}
          >
            {initials}
          </div>
          <div className="text-left">
            <div className="text-[13px] font-semibold text-white">{user?.fullName}</div>
            <div className="text-[10px] text-white/60">Acces lecture seule</div>
          </div>
        </button>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          {clientNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/client'}
              className={({ isActive }) =>
                `mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] transition-colors ${
                  isActive
                    ? 'font-semibold text-white shadow-md'
                    : 'text-white/75 hover:bg-white/8 hover:text-white'
                }`
              }
              style={({ isActive }) => 
                isActive ? { backgroundColor: 'var(--color-theme-primary)' } : {}
              }
            >
              <item.icon className="text-[15px]" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Déconnexion */}
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
        <header 
          className="flex items-center justify-between border-b px-6 py-3.5 sticky top-0 z-10"
          style={{ 
            backgroundColor: 'var(--color-theme-surface)',
            borderColor: 'var(--color-theme-border)'
          }}
        >
          <div>
            <h1 
              className="font-head text-[17px] font-semibold"
              style={{ color: 'var(--color-theme-text-primary)' }}
            >
              {pageTitle}
            </h1>
            <p 
              className="text-xs"
              style={{ color: 'var(--color-theme-text-secondary)' }}
            >
              {pageSubtitle}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Filtre de période */}
            <div 
              className="flex gap-1 rounded-lg p-1"
              style={{ backgroundColor: 'var(--color-theme-neutral-light)' }}
            >
              {[
                { key: 'today', label: "Aujourd'hui" },
                { key: 'month', label: 'Ce mois' },
                { key: 'quarter', label: 'Trimestre' },
                { key: 'year', label: 'Annee' },
              ].map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPeriod(p.key as 'today' | 'month' | 'quarter' | 'year')}
                  className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
                    period === p.key ? 'font-semibold shadow-sm' : ''
                  }`}
                  style={
                    period === p.key
                      ? {
                          backgroundColor: 'var(--color-theme-surface)',
                          color: 'var(--color-theme-text-primary)',
                        }
                      : {
                          color: 'var(--color-theme-text-secondary)',
                        }
                  }
                >
                  {p.label}
                </button>
              ))}
            </div>
            {/* Indicateur en direct */}
            <div 
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold"
              style={{ 
                backgroundColor: 'var(--color-theme-success-light)',
                color: 'var(--color-theme-success)'
              }}
            >
              <span 
                className="h-1.5 w-1.5 animate-pulse rounded-full"
                style={{ backgroundColor: 'var(--color-theme-success)' }}
              />
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
