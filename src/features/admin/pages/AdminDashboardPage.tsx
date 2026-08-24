import { useState, useEffect, useMemo } from 'react';
import api from '@/common/services/api';
import { useAuthStore } from '@/common/stores/auth.store';
import DashboardCoordinateur from './DashboardCoordinateur';
import {
  RiTeamLine,
  RiUserLine,
  RiSmartphoneLine,
  RiBarChartLine,
  RiArrowUpLine,
  RiCheckboxCircleLine,
  RiLoader4Line,
  RiTrophyLine,
  RiAlertLine,
  RiMapPinLine,
  RiArrowDownLine,
  RiCalendarLine,
  RiCheckLine,
} from 'react-icons/ri';

/* ─── Types ─── */
interface ClusterSummary {
  id: string;
  name: string;
  supervisor?: { id: string; fullName: string; matricule: string } | null;
  communes: { id: string; name: string }[];
  _count: { members: number };
}

interface UserSummary {
  id: string;
  fullName: string;
  matricule: string;
  role: string;
  isActive: boolean;
  cluster?: { id: string; name: string } | null;
  createdAt: string;
}

interface ComprehensiveKPIs {
  production: {
    plannedWorkforce: number;  // Effectif prévu
    recruitedWorkforce: number; // Effectif recruté
    activeTodayWorkforce: number; // Effectif actif
    clientsApproached: number; // Clients approchés (nombre brut)
    installations: number;
    installationsPlusActivations: number; // Installations + Activations
    activationRate: number; // Taux d'activation
  };
  performance: {
    objective: number;
    achieved: number;
    achievementPercent: number;
    productivityPerAgent: number;
    clusterPerformance: { clusterId: string; clusterName: string; achieved: number; objective: number }[];
  };
  quality: {
    filesSubmitted: number;
    filesValidated: number;
    filesRejected: number;
    validationRate: number;
  };
  pilotage: {
    coveredZones: number;
    mainAlerts: { type: string; count: number; message: string }[];
    globalScore: number;
  };
}

type Period = 'day' | 'week' | 'month';

const periodLabels: Record<Period, string> = {
  day: "Aujourd'hui",
  week: 'Cette semaine',
  month: 'Ce mois',
};

/* ─── Main Router ─── */
export default function AdminDashboardPage() {
  const user = useAuthStore((s) => s.user);
  if (user?.role === 'COORDINATEUR') return <DashboardCoordinateur />;
  return <DashboardAdmin />;
}

/* ─── ADMIN Dashboard ─── */
function DashboardAdmin() {
  const [clusters, setClusters] = useState<ClusterSummary[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('day');
  
  // États pour les KPIs structurés
  const [kpis, setKpis] = useState<ComprehensiveKPIs | null>(null);

  // Charger les clusters et users une seule fois
  useEffect(() => {
    async function loadInitial() {
      try {
        const [clustersRes, usersRes] = await Promise.all([
          api.get('/clusters'),
          api.get('/users?limit=1000'),
        ]);
        setClusters(Array.isArray(clustersRes.data) ? clustersRes.data : []);
        setUsers(usersRes.data?.data || []);
      } catch {
        /* ignore */
      }
    }
    loadInitial();
  }, []);

  // Charger les KPIs quand la période change
  useEffect(() => {
    async function loadKpis() {
      setLoading(true);
      try {
        const statsRes = await api.get(`/submissions/stats?period=${period}`);
        setKpis(statsRes.data);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }
    loadKpis();
  }, [period]);

  const recentUsers = useMemo(() => {
    return [...users]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [users]);

  // Calculer l'objectif selon la période
  const getObjectiveLabel = () => {
    switch (period) {
      case 'day': return 'Objectif du jour';
      case 'week': return 'Objectif semaine';
      case 'month': return 'Objectif mensuel';
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <RiLoader4Line className="animate-spin text-4xl text-k2l-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec filtre de période */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-head text-xl font-bold text-k2l-gray-900">Tableau de bord Admin</h1>
          <p className="text-sm text-k2l-gray-500">
            Données : {periodLabels[period]} — tous les clusters
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Filtre de période */}
          <div className="flex items-center gap-2">
            <RiCalendarLine className="text-k2l-gray-400" />
            <div className="flex rounded-lg border border-k2l-gray-200 bg-white p-1">
              {(['day', 'week', 'month'] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    period === p
                      ? 'bg-k2l-primary text-white'
                      : 'text-k2l-gray-600 hover:bg-k2l-gray-100'
                  }`}
                >
                  {periodLabels[p]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 1. Production */}
      <div>
        <h2 className="mb-4 font-head text-sm font-semibold uppercase tracking-wider text-k2l-gray-600">Production</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {/* Nouveaux KPIs Effectif */}
          <KpiCard 
            label="Effectif prévu" 
            value={kpis?.production.plannedWorkforce || 0} 
            icon={<RiTeamLine />} 
            bg="bg-k2l-gray-100" 
          />
          <KpiCard 
            label="Effectif recruté" 
            value={kpis?.production.recruitedWorkforce || 0} 
            icon={<RiUserLine />} 
            bg="bg-k2l-primary-light" 
          />
          <KpiCard 
            label="Effectif actif" 
            value={kpis?.production.activeTodayWorkforce || 0} 
            icon={<RiCheckLine />} 
            bg="bg-k2l-success-light" 
          />
        </div>
        
        {/* Ligne 2: Installations, Activation + Installation */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <KpiCard 
            label="Installations" 
            value={kpis?.production.installations || 0} 
            icon={<RiSmartphoneLine />} 
            bg="bg-k2l-blue-light" 
          />
          <KpiCard 
            label="Activation + Installation" 
            value={kpis?.production.installationsPlusActivations || 0} 
            icon={<RiCheckboxCircleLine />} 
            bg="bg-k2l-amber-light" 
          />
        </div>
      </div>

      {/* 2. KPIs Clés - Indicateurs de Performance */}
      <div>
        <h2 className="mb-4 font-head text-sm font-semibold uppercase tracking-wider text-k2l-gray-600">Indicateurs Clés</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard 
            label="Taux de validation" 
            value={kpis?.quality.validationRate ?? 0} 
            suffix="%" 
            icon={<RiCheckboxCircleLine />} 
            bg={(kpis?.quality.validationRate ?? 0) >= 80 ? 'bg-k2l-success-light' : (kpis?.quality.validationRate ?? 0) >= 60 ? 'bg-k2l-amber-light' : 'bg-k2l-red-light'}
          />
          <KpiCard 
            label="Taux d'activation" 
            value={kpis?.production.activationRate ?? 0} 
            suffix="%" 
            icon={<RiArrowUpLine />} 
            bg={(kpis?.production.activationRate ?? 0) >= 80 ? 'bg-k2l-success-light' : (kpis?.production.activationRate ?? 0) >= 60 ? 'bg-k2l-amber-light' : 'bg-k2l-red-light'}
          />
          <KpiCard 
            label={getObjectiveLabel()} 
            value={kpis?.performance.objective || 0} 
            icon={<RiTrophyLine />} 
            bg="bg-k2l-gray-100" 
          />
          <KpiCard 
            label="Réalisation" 
            value={kpis?.performance.achievementPercent ?? 0} 
            suffix="%" 
            icon={<RiBarChartLine />} 
            bg={(kpis?.performance.achievementPercent ?? 0) >= 80 ? 'bg-k2l-success-light' : (kpis?.performance.achievementPercent ?? 0) >= 50 ? 'bg-k2l-amber-light' : 'bg-k2l-red-light'}
          />
        </div>
        
        {/* Ligne 2: Réalisé + Productivité */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <KpiCard 
            label="Réalisé" 
            value={kpis?.performance.achieved ?? 0} 
            icon={<RiBarChartLine />} 
            bg="bg-k2l-success-light" 
          />
          <KpiCard 
            label="Productivité/agent" 
            value={kpis?.performance.productivityPerAgent || 0} 
            icon={<RiUserLine />} 
            bg="bg-k2l-blue-light" 
          />
        </div>
        
        {/* Performance par cluster */}
        {kpis?.performance.clusterPerformance && kpis.performance.clusterPerformance.length > 0 && (
          <div className="mt-4 rounded-xl border border-k2l-gray-200 bg-white p-5">
            <h3 className="mb-4 font-head text-sm font-semibold">Performance par cluster</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {kpis.performance.clusterPerformance.map((cluster) => (
                <div key={cluster.clusterId} className="rounded-lg border border-k2l-gray-200 p-4">
                  <div className="font-medium text-k2l-gray-900">{cluster.clusterName}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm text-k2l-gray-500">{cluster.achieved} / {cluster.objective}</span>
                    <span className={`text-sm font-bold ${cluster.achieved / cluster.objective >= 0.8 ? 'text-k2l-success' : cluster.achieved / cluster.objective >= 0.5 ? 'text-k2l-amber' : 'text-k2l-red'}`}>
                      {Math.round((cluster.achieved / cluster.objective) * 100)}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-k2l-gray-200">
                    <div 
                      className={`h-2 rounded-full ${cluster.achieved / cluster.objective >= 0.8 ? 'bg-k2l-success' : cluster.achieved / cluster.objective >= 0.5 ? 'bg-k2l-amber' : 'bg-k2l-red'}`}
                      style={{ width: `${Math.min((cluster.achieved / cluster.objective) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Qualité */}
      <div>
        <h2 className="mb-4 font-head text-sm font-semibold uppercase tracking-wider text-k2l-gray-600">Qualité</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <KpiCard 
            label="Dossiers soumis" 
            value={kpis?.quality.filesSubmitted || 0} 
            icon={<RiBarChartLine />} 
            bg="bg-k2l-blue-light" 
          />
          <KpiCard 
            label="Dossiers validés" 
            value={kpis?.quality.filesValidated || 0} 
            icon={<RiCheckboxCircleLine />} 
            bg="bg-k2l-success-light" 
          />
          <KpiCard 
            label="Dossiers rejetés" 
            value={kpis?.quality.filesRejected || 0} 
            icon={<RiArrowDownLine />} 
            bg="bg-k2l-red-light" 
          />
        </div>
      </div>

      {/* 4. Pilotage */}
      <div>
        <h2 className="mb-4 font-head text-sm font-semibold uppercase tracking-wider text-k2l-gray-600">Pilotage</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Score global */}
          <div className="rounded-xl border border-k2l-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400">Score global</div>
                <div className="mt-2 font-head text-4xl font-bold text-k2l-gray-900">
                  {kpis?.pilotage.globalScore ?? 0}/100
                </div>
              </div>
              <div className={`h-16 w-16 rounded-full flex items-center justify-center ${(kpis?.pilotage.globalScore ?? 0) >= 70 ? 'bg-k2l-success-light' : (kpis?.pilotage.globalScore ?? 0) >= 50 ? 'bg-k2l-amber-light' : 'bg-k2l-red-light'}`}>
                <RiTrophyLine className={`text-3xl ${(kpis?.pilotage.globalScore ?? 0) >= 70 ? 'text-k2l-success' : (kpis?.pilotage.globalScore ?? 0) >= 50 ? 'text-k2l-amber' : 'text-k2l-red'}`} />
              </div>
            </div>
          </div>

          {/* Zones couvertes */}
          <div className="rounded-xl border border-k2l-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400">Zones couvertes</div>
                <div className="mt-2 font-head text-4xl font-bold text-k2l-gray-900">
                  {kpis?.pilotage.coveredZones || 0}
                </div>
              </div>
              <div className="h-16 w-16 rounded-full bg-k2l-primary-light flex items-center justify-center">
                <RiMapPinLine className="text-3xl text-k2l-primary" />
              </div>
            </div>
          </div>

          {/* Alertes */}
          <div className="rounded-xl border border-k2l-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400">Alertes</div>
                <div className="mt-2 font-head text-4xl font-bold text-k2l-gray-900">
                  {kpis?.pilotage.mainAlerts?.length || 0}
                </div>
              </div>
              <div className={`h-16 w-16 rounded-full flex items-center justify-center ${(kpis?.pilotage.mainAlerts?.length || 0) > 0 ? 'bg-k2l-red-light' : 'bg-k2l-success-light'}`}>
                <RiAlertLine className={`text-3xl ${(kpis?.pilotage.mainAlerts?.length || 0) > 0 ? 'text-k2l-red' : 'text-k2l-success'}`} />
              </div>
            </div>
            {kpis?.pilotage.mainAlerts && kpis.pilotage.mainAlerts.length > 0 && (
              <div className="mt-3 space-y-2">
                {kpis.pilotage.mainAlerts.slice(0, 3).map((alert, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-k2l-gray-600">
                    <RiAlertLine className="text-k2l-amber" />
                    <span>{alert.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clusters overview */}
      <div>
        <div className="mb-2 font-head text-[13px] font-semibold uppercase tracking-wider text-k2l-gray-600">
          Vue d'ensemble des clusters
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clusters.map((cluster) => (
            <ClusterCard key={cluster.id} cluster={cluster} users={users} />
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <div className="mb-2 font-head text-[13px] font-semibold uppercase tracking-wider text-k2l-gray-600">
          Activité récente (utilisateurs)
        </div>
        <div className="rounded-xl border border-k2l-gray-200 bg-white">
          <table className="w-full text-[13px]">
            <tbody>
              {recentUsers.map((u) => (
                <tr key={u.id} className="border-b border-k2l-gray-100 last:border-0">
                  <td className="px-4 py-3">
                    <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-k2l-primary-light font-head text-[11px] font-bold text-k2l-primary">
                      {u.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                    {u.fullName}
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-4 py-3 text-k2l-gray-400">
                    {u.cluster?.name || '—'}
                  </td>
                  <td className="px-4 py-3 text-k2l-gray-400 text-[12px]">
                    {timeAgo(u.createdAt)}
                  </td>
                </tr>
              ))}
              {recentUsers.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-k2l-gray-400">Aucune activité</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── Components ─── */
function KpiCard({ label, value, icon, bg, suffix }: { label: string; value: number; icon: React.ReactNode; bg: string; suffix?: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-k2l-gray-200 bg-white p-5">
      <div className={`absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg ${bg} text-[17px] text-k2l-primary`}>
        {icon}
      </div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-400">{label}</div>
      <div className="mt-2 font-head text-3xl font-bold text-k2l-gray-900">
        {value.toLocaleString('fr-FR')}{suffix || ''}
      </div>
    </div>
  );
}

function ClusterCard({ cluster, users }: { cluster: ClusterSummary; users: UserSummary[] }) {
  const clusterUsers = users.filter((u) => u.cluster?.id === cluster.id);
  const commerciaux = clusterUsers.filter((u) => u.role === 'COMMERCIAL').length;
  const hasSupervisor = !!cluster.supervisor;

  return (
    <div className={`rounded-xl border-l-4 bg-white p-4 shadow-sm ${hasSupervisor ? 'border-k2l-success' : 'border-k2l-red'}`}>
      <div className="font-head text-[15px] font-semibold text-k2l-gray-900">{cluster.name}</div>
      <div className="mt-1 text-[12px] leading-relaxed text-k2l-gray-400">
        {hasSupervisor
          ? `Superviseur : ${cluster.supervisor!.fullName} · ${commerciaux} commerciaux`
          : `Aucun superviseur assigné · ${commerciaux} commerciaux`}
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const cfg: Record<string, string> = {
    COORDINATEUR: 'bg-k2l-amber-light text-k2l-amber',
    SUPERVISEUR: 'bg-k2l-primary-light text-k2l-primary',
    COMMERCIAL: 'bg-k2l-gray-100 text-k2l-gray-600',
    ADMIN: 'bg-k2l-success-light text-k2l-success',
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${cfg[role] || cfg.COMMERCIAL}`}>
      {role === 'COORDINATEUR' ? 'Coordinateur' : role === 'SUPERVISEUR' ? 'Superviseur' : role === 'COMMERCIAL' ? 'Commercial' : role}
    </span>
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `il y a ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}
