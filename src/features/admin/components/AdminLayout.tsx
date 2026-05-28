import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/common/stores/auth.store';
import {
  RiHome5Line,
  RiTeamLine,
  RiMapPin2Line,
  RiSettings4Line,
  RiLogoutBoxRLine,
  RiSearchLine,
  RiLeafLine,
  RiCheckboxCircleLine,
  RiUserLine,
} from 'react-icons/ri';

interface NavItem {
  to: string;
  icon: typeof RiHome5Line;
  label: string;
  roles: string[];
}

const adminNav: NavItem[] = [
  { to: '/admin', icon: RiHome5Line, label: 'Tableau de bord', roles: ['ADMIN', 'COORDINATEUR', 'SUPERVISEUR'] },
  { to: '/admin/validations', icon: RiCheckboxCircleLine, label: 'Validations', roles: ['COORDINATEUR'] },
  { to: '/admin/zones', icon: RiMapPin2Line, label: 'Zones', roles: ['ADMIN'] },
  { to: '/admin/secteurs', icon: RiSettings4Line, label: 'Secteurs', roles: ['ADMIN', 'COORDINATEUR'] },
  { to: '/admin/users', icon: RiTeamLine, label: 'Utilisateurs', roles: ['ADMIN', 'COORDINATEUR'] },
  { to: '/admin/commerciaux', icon: RiUserLine, label: 'Mes Commerciaux', roles: ['SUPERVISEUR'] },
];

export default function AdminLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const location = useLocation();

  const userRole = user?.role || 'ADMIN';
  const filteredNav = adminNav.filter((item) => item.roles.includes(userRole));

  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '??';

  const pageTitle = (() => {
    if (location.pathname === '/admin') return 'Tableau de bord';
    if (location.pathname.includes('/users')) return 'Gestion des utilisateurs';
    if (location.pathname.includes('/zones')) return 'Zones';
    if (location.pathname.includes('/secteurs')) return 'Secteurs';
    if (location.pathname.includes('/validations')) return 'Validations N2';
    if (location.pathname.includes('/commerciaux')) return 'Mes Commerciaux';
    return 'Back-office';
  })();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-k2l-gray-100">
      {/* Sidebar */}
      <aside className="flex h-full w-[230px] flex-shrink-0 flex-col bg-k2l-navy">
        <div className="flex items-center gap-2.5 border-b border-white/10 px-5 pb-4 pt-5">
          <div className="flex h-9 w-9 items-center justify-content-center rounded-lg bg-white/15 text-white">
            <RiLeafLine className="mx-auto text-lg" />
          </div>
          <span className="font-head text-base font-bold text-white">K2L Terrain</span>
        </div>

        <div className="flex items-center gap-2.5 border-b border-white/10 px-5 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/30 bg-white/15 font-head text-xs font-bold text-white">
            {initials}
          </div>
          <div>
            <div className="text-[13px] font-semibold text-white">{user?.fullName}</div>
            <div className="text-[11px] text-white/60">
              {user?.role === 'ADMIN' ? 'Administrateur' : user?.role === 'COORDINATEUR' ? 'Coordinateur' : user?.role}
            </div>
          </div>
        </div>

        {user?.role === 'COORDINATEUR' && user?.zone && (
          <div className="mx-4 mt-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-[11px] text-white">
            Périmètre : <span className="font-head font-bold">{user.zone.name}</span>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <div className="mb-1 px-2 pt-3 text-[10px] font-medium uppercase tracking-wider text-white/40">
            Navigation
          </div>
          {filteredNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              className={({ isActive }) =>
                `mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] transition-colors ${
                  isActive
                    ? 'bg-k2l-success font-semibold text-white'
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
          Déconnexion
        </button>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between border-b border-k2l-gray-200 bg-white px-6 py-3.5 sticky top-0 z-10">
          <div>
            <h1 className="font-head text-[17px] font-semibold">{pageTitle}</h1>
            <p className="text-xs text-k2l-gray-400">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-k2l-gray-200 bg-k2l-gray-100 px-3 py-2">
              <RiSearchLine className="text-sm text-k2l-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="w-48 bg-transparent text-[13px] text-k2l-gray-600 outline-none placeholder:text-k2l-gray-400"
              />
            </div>
            {user?.role === 'COORDINATEUR' && user?.zone ? (
              <div className="flex items-center gap-1.5 rounded-lg bg-k2l-navy px-3 py-1.5 text-[12px] font-semibold text-white">
                {user.zone.name}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 rounded-full bg-k2l-success-light px-3 py-1.5 text-[11px] font-semibold text-k2l-success">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-k2l-success" />
                En direct
              </div>
            )}
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
