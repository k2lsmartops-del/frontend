import { useNavigate } from 'react-router-dom';
import {
  RiUserLine, RiLogoutBoxRLine, RiMailLine, RiPhoneLine,
  RiShieldUserLine, RiMapPin2Line, RiCalendarLine,
} from '@/common/icons';
import { useAuthStore } from '@/common/stores/auth.store';
import { useOnlineStatus } from '@/common/hooks/useOnlineStatus';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrateur',
  COORDINATEUR: 'Coordinateur',
  SUPERVISEUR: 'Superviseur',
  COMMERCIAL: 'Commercial',
  CLIENT: 'Client',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIF: 'Actif',
  SUSPENDU: 'Suspendu',
  EN_ATTENTE: 'En attente',
  DESACTIVE: 'Desactive',
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isOnline = useOnlineStatus();

  const initials = user?.fullName
    ?.split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? 'AG';

  const handleLogout = () => {
    if (!confirm('Voulez-vous vraiment vous deconnecter ?')) return;
    logout();
    navigate('/login', { replace: true });
  };

  const infoRows: { icon: React.ReactNode; label: string; value: string }[] = [
    { icon: <RiShieldUserLine />, label: 'Role', value: ROLE_LABELS[user?.role ?? ''] ?? user?.role ?? '—' },
    { icon: <RiUserLine />, label: 'Matricule', value: user?.matricule ?? '—' },
    { icon: <RiPhoneLine />, label: 'Telephone', value: user?.phone ?? '—' },
    { icon: <RiMailLine />, label: 'Email', value: user?.email ?? 'Non renseigne' },
    { icon: <RiMapPin2Line />, label: 'Zone', value: user?.zone?.name ?? 'Non assignee' },
    {
      icon: <RiCalendarLine />,
      label: 'Inscrit le',
      value: user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
        : '—',
    },
  ];

  return (
    <div className="min-h-full bg-k2l-gray-100">
      {/* Header */}
      <div className="bg-k2l-navy px-5 pb-8 pt-6">
        <div className="flex flex-col items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-white/30 bg-white/20 font-head text-2xl font-bold text-white">
            {initials}
          </div>
          <h1 className="mt-3 font-head text-lg font-bold text-white">{user?.fullName ?? 'Agent'}</h1>
          <div className="mt-1 flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
              user?.status === 'ACTIF' ? 'bg-k2l-success-light text-k2l-success' : 'bg-k2l-amber-light text-[#854F0B]'
            }`}>
              {STATUS_LABELS[user?.status ?? ''] ?? user?.status}
            </span>
            <span className="text-xs text-white/60">{ROLE_LABELS[user?.role ?? ''] ?? user?.role}</span>
          </div>
        </div>
      </div>

      {/* Info card */}
      <div className="-mt-4 mx-4 rounded-lg bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
        <div className="mb-3 font-head text-[13px] font-semibold uppercase tracking-wider text-k2l-gray-600">
          Informations
        </div>
        <div className="divide-y divide-k2l-gray-100">
          {infoRows.map((row) => (
            <div key={row.label} className="flex items-center gap-3 py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-k2l-primary-light text-k2l-primary">
                {row.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-k2l-gray-400">{row.label}</div>
                <div className="truncate text-[13px] font-medium text-k2l-gray-900">{row.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Connection status */}
      <div className="mx-4 mt-3 rounded-lg bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-k2l-gray-600">Statut connexion</span>
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
            isOnline ? 'bg-k2l-success-light text-k2l-success' : 'bg-k2l-amber-light text-[#854F0B]'
          }`}>
            {isOnline ? 'En ligne' : 'Hors-ligne'}
          </span>
        </div>
      </div>

      {/* Logout button */}
      <div className="mx-4 mt-4 pb-6">
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-k2l-red bg-white py-3.5 font-head text-sm font-semibold text-k2l-red transition-all active:scale-[0.98] active:bg-k2l-red-light"
        >
          <RiLogoutBoxRLine className="text-lg" />
          Se deconnecter
        </button>
      </div>
    </div>
  );
}
