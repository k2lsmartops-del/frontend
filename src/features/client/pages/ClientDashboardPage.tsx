import { useState, useEffect } from 'react';
import {
  RiUserLine,
  RiStore2Line,
  RiSmartphoneLine,
  RiBarChartLine,
  RiArrowUpLine,
  RiLoader4Line,
  RiTeamLine,
  RiCheckboxCircleLine,
  RiAlertLine,
  RiTrophyLine,
  RiMapPinLine,
  RiArrowDownLine,
} from 'react-icons/ri';
import api from '@/common/services/api';
import { useFilterStore } from '@/common/stores/filter.store';

interface ComprehensiveKPIs {
  production: {
    activeAgents: number;
    clientsApproached: number;
    installations: number;
    activations: number;
    activeClients: number;
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

export default function ClientDashboardPage() {
  const [kpis, setKpis] = useState<ComprehensiveKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const { period } = useFilterStore();

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      const statsRes = await api.get('/submissions/stats');
      setKpis(statsRes.data);
    } catch (error) {
      console.error('Erreur de chargement des données', error);
    } finally {
      setLoading(false);
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
      {/* 1. Production */}
      <div>
        <h2 className="mb-4 font-head text-sm font-semibold uppercase tracking-wider text-k2l-gray-600">Production</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <KpiCard 
            label="Agents actifs" 
            value={kpis?.production.activeAgents || 0} 
            icon={<RiTeamLine />} 
            bg="bg-k2l-primary-light" 
          />
          <KpiCard 
            label="Clients approchés" 
            value={kpis?.production.clientsApproached || 0} 
            icon={<RiUserLine />} 
            bg="bg-k2l-success-light" 
          />
          <KpiCard 
            label="Installations" 
            value={kpis?.production.installations || 0} 
            icon={<RiSmartphoneLine />} 
            bg="bg-k2l-blue-light" 
          />
          <KpiCard 
            label="Activations" 
            value={kpis?.production.activations || 0} 
            icon={<RiCheckboxCircleLine />} 
            bg="bg-k2l-amber-light" 
          />
          <KpiCard 
            label="Clients actifs" 
            value={kpis?.production.activeClients || 0} 
            icon={<RiStore2Line />} 
            bg="bg-k2l-purple-light" 
          />
        </div>
      </div>

      {/* 2. Performance */}
      <div>
        <h2 className="mb-4 font-head text-sm font-semibold uppercase tracking-wider text-k2l-gray-600">Performance</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard 
            label="Objectif" 
            value={kpis?.performance.objective || 0} 
            icon={<RiTrophyLine />} 
            bg="bg-k2l-gray-100" 
          />
          <KpiCard 
            label="Réalisé" 
            value={kpis?.performance.achieved || 0} 
            icon={<RiBarChartLine />} 
            bg="bg-k2l-success-light" 
          />
          <KpiCard 
            label="% atteinte" 
            value={kpis?.performance.achievementPercent ?? 0} 
            suffix="%" 
            icon={<RiArrowUpLine />} 
            bg={(kpis?.performance.achievementPercent ?? 0) >= 80 ? 'bg-k2l-success-light' : (kpis?.performance.achievementPercent ?? 0) >= 50 ? 'bg-k2l-amber-light' : 'bg-k2l-red-light'}
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
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
          <KpiCard 
            label="Taux validation" 
            value={kpis?.quality.validationRate ?? 0} 
            suffix="%" 
            icon={<RiTrophyLine />} 
            bg={(kpis?.quality.validationRate ?? 0) >= 80 ? 'bg-k2l-success-light' : (kpis?.quality.validationRate ?? 0) >= 60 ? 'bg-k2l-amber-light' : 'bg-k2l-red-light'}
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
    </div>
  );
}

function KpiCard({ label, value, icon, bg, suffix }: { 
  label: string; 
  value: number; 
  icon: React.ReactNode; 
  bg: string; 
  suffix?: string;
}) {
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
