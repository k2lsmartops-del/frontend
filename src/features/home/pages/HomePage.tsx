import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiUserLine, RiStore2Line, RiFileList3Line, RiRefreshLine,
  RiWifiLine, RiWifiOffLine,
} from '@/common/icons';
import { useAuthStore } from '@/common/stores/auth.store';
import { useToastStore } from '@/common/stores/toast.store';
import { useOnlineStatus } from '@/common/hooks/useOnlineStatus';

export default function HomePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const showToast = useToastStore((s) => s.show);
  const isOnline = useOnlineStatus();

  const initials = user?.fullName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? 'AG';

  return (
    <div className="min-h-full bg-k2l-gray-100 pb-4">
      {/* Header */}
      <div className="bg-k2l-navy px-5 pb-7 pt-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-white/40 bg-white/20 font-head text-base font-bold text-white">
            {initials}
          </div>
          <div className="flex-1">
            <div className="font-head text-base font-semibold text-white">{user?.fullName ?? 'Agent K2L'}</div>
            <div className="mt-0.5 text-xs text-white/70">{user?.zone?.name ?? 'Zone non assignee'}</div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-2.5 py-1">
            {isOnline
              ? <><RiWifiLine className="text-sm text-k2l-primary-mid" /><span className="text-[11px] text-white">En ligne</span></>
              : <><RiWifiOffLine className="text-sm text-k2l-amber" /><span className="text-[11px] text-white">Hors-ligne</span></>}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="-mt-5 mb-4 grid grid-cols-3 gap-2.5 px-4">
        {[
          { label: 'Prospects', value: '--', color: 'text-k2l-primary' },
          { label: 'Marchands', value: '--', color: 'text-k2l-amber' },
          { label: 'Valides', value: '--', color: 'text-k2l-success' },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-md bg-white px-2.5 py-3 text-center shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
            <div className={`font-head text-[22px] font-bold ${kpi.color}`}>{kpi.value}</div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wider text-k2l-gray-400">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="mb-2.5 px-4 font-head text-[13px] font-semibold uppercase tracking-wider text-k2l-gray-600">Actions terrain</div>
      <div className="mb-6 grid grid-cols-2 gap-3 px-4">
        <ActionCard icon={<RiUserLine className="text-xl text-k2l-navy" />} bgIcon="bg-k2l-primary-light" label="Nouveau Prospect" sub="Client banque" onClick={() => navigate('/prospect')} />
        <ActionCard icon={<RiStore2Line className="text-xl text-[#854F0B]" />} bgIcon="bg-k2l-amber-light" label="Enroler Marchand" sub="Commerce partenaire" onClick={() => navigate('/marchand')} />
        <ActionCard icon={<RiFileList3Line className="text-xl text-k2l-primary" />} bgIcon="bg-k2l-primary-light" label="Historique" sub="Mes soumissions" onClick={() => navigate('/history')} />
        <ActionCard icon={<RiRefreshLine className="text-xl text-k2l-red" />} bgIcon="bg-k2l-red-light" label="Synchroniser" sub="0 en attente" onClick={() => showToast('Synchronisation en cours...', 'info')} />
      </div>

      {/* Recent */}
      <div className="mb-2.5 px-4 font-head text-[13px] font-semibold uppercase tracking-wider text-k2l-gray-600">Activite recente</div>
      <div className="px-4 pb-6">
        <div className="rounded-md bg-white p-8 text-center text-sm text-k2l-gray-400 shadow-sm">
          Les dernieres soumissions apparaitront ici
        </div>
      </div>
    </div>
  );
}

function ActionCard({ icon, bgIcon, label, sub, onClick }: {
  icon: ReactNode; bgIcon: string; label: string; sub: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className="flex flex-col items-start rounded-lg border-[1.5px] border-transparent bg-white p-4 text-left shadow-[0_2px_10px_rgba(0,0,0,0.06)] transition-all active:scale-[0.97] hover:border-k2l-primary">
      <div className={`mb-2.5 flex h-[42px] w-[42px] items-center justify-center rounded-sm ${bgIcon}`}>{icon}</div>
      <div className="font-head text-[13px] font-semibold text-k2l-gray-900">{label}</div>
      <div className="mt-0.5 text-[11px] text-k2l-gray-400">{sub}</div>
    </button>
  );
}
