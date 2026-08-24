import { useState, useEffect } from 'react';
import {
  RiUserLine,
  RiBarChartLine,
  RiArrowUpLine,
  RiLoader4Line,
  RiTeamLine,
  RiCheckboxCircleLine,
  RiAlertLine,
  RiTrophyLine,
  RiMapPinLine,
  RiArrowDownLine,
  RiCalendarLine,
  RiCheckLine,
} from 'react-icons/ri';
import api from '@/common/services/api';

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

export default function ClientDashboardPage() {
  const [kpis, setKpis] = useState<ComprehensiveKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('day');

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    setLoading(true);
    try {
      const statsRes = await api.get(`/submissions/stats?period=${period}`);
      setKpis(statsRes.data);
    } catch (error) {
      console.error('Erreur de chargement des données', error);
    } finally {
      setLoading(false);
    }
  };

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
        <RiLoader4Line 
          className="animate-spin text-4xl"
          style={{ color: 'var(--color-theme-primary)' }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec filtre de période */}
      <div className="flex items-center justify-between">
        <div>
          <h1 
            className="font-head text-xl font-bold"
            style={{ color: 'var(--color-theme-text-primary)' }}
          >
            Tableau de bord
          </h1>
          <p 
            className="text-sm"
            style={{ color: 'var(--color-theme-text-secondary)' }}
          >
            Données : {periodLabels[period]}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RiCalendarLine 
            style={{ color: 'var(--color-theme-text-secondary)' }}
          />
          <div 
            className="flex rounded-lg border p-1"
            style={{ 
              borderColor: 'var(--color-theme-border)',
              backgroundColor: 'var(--color-theme-surface)'
            }}
          >
            {(['day', 'week', 'month'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  period === p ? 'text-white' : ''
                }`}
                style={
                  period === p
                    ? { backgroundColor: 'var(--color-theme-primary)' }
                    : { color: 'var(--color-theme-text-secondary)' }
                }
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 1. Production */}
      <div>
        <h2 
          className="mb-4 font-head text-sm font-semibold uppercase tracking-wider"
          style={{ color: 'var(--color-theme-text-secondary)' }}
        >
          Production
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {/* Nouveaux KPIs Effectif */}
          <KpiCard 
            label="Effectif prévu" 
            value={kpis?.production.plannedWorkforce || 0} 
            icon={<RiTeamLine />} 
            variant="neutral" 
          />
          <KpiCard 
            label="Effectif recruté" 
            value={kpis?.production.recruitedWorkforce || 0} 
            icon={<RiUserLine />} 
            variant="primary" 
          />
          <KpiCard 
            label="Effectif actif" 
            value={kpis?.production.activeTodayWorkforce || 0} 
            icon={<RiCheckLine />} 
            variant="success" 
          />
          <KpiCard 
            label="Clients approchés" 
            value={kpis?.production.clientsApproached || 0} 
            icon={<RiUserLine />} 
            variant="success" 
          />
        </div>
        
        {/* Ligne 2: Installations, Activation + Installation */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <KpiCard 
            label="Installations" 
            value={kpis?.production.installations || 0} 
            icon={<RiCheckboxCircleLine />} 
            variant="primary" 
          />
          <KpiCard 
            label="Activation + Installation" 
            value={kpis?.production.installationsPlusActivations || 0} 
            icon={<RiCheckboxCircleLine />} 
            variant="success" 
          />
        </div>
      </div>

      {/* 2. KPIs Clés - Indicateurs de Performance */}
      <div>
        <h2 
          className="mb-4 font-head text-sm font-semibold uppercase tracking-wider"
          style={{ color: 'var(--color-theme-text-secondary)' }}
        >
          Indicateurs Clés
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard 
            label="Taux de validation" 
            value={kpis?.quality.validationRate ?? 0} 
            suffix="%" 
            icon={<RiCheckboxCircleLine />} 
            variant={(kpis?.quality.validationRate ?? 0) >= 80 ? 'success' : (kpis?.quality.validationRate ?? 0) >= 60 ? 'warning' : 'danger'}
          />
          <KpiCard 
            label="Taux d'activation" 
            value={kpis?.production.activationRate ?? 0} 
            suffix="%" 
            icon={<RiArrowUpLine />} 
            variant={(kpis?.production.activationRate ?? 0) >= 80 ? 'success' : (kpis?.production.activationRate ?? 0) >= 60 ? 'warning' : 'danger'}
          />
          <KpiCard 
            label={getObjectiveLabel()} 
            value={kpis?.performance.objective || 0} 
            icon={<RiTrophyLine />} 
            variant="neutral" 
          />
          <KpiCard 
            label="Réalisation" 
            value={kpis?.performance.achievementPercent ?? 0} 
            suffix="%" 
            icon={<RiBarChartLine />} 
            variant={(kpis?.performance.achievementPercent ?? 0) >= 80 ? 'success' : (kpis?.performance.achievementPercent ?? 0) >= 50 ? 'warning' : 'danger'}
          />
        </div>
        
        {/* Ligne 2: Réalisé + Productivité */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <KpiCard 
            label="Réalisé" 
            value={kpis?.performance.achieved || 0} 
            icon={<RiBarChartLine />} 
            variant="success" 
          />
          <KpiCard 
            label="Productivité/agent" 
            value={kpis?.performance.productivityPerAgent || 0} 
            icon={<RiUserLine />} 
            variant="primary" 
          />
        </div>
        
        {/* Performance par cluster */}
        {kpis?.performance.clusterPerformance && kpis.performance.clusterPerformance.length > 0 && (
          <div 
            className="mt-4 rounded-xl border p-5"
            style={{ 
              backgroundColor: 'var(--color-theme-surface)',
              borderColor: 'var(--color-theme-border)'
            }}
          >
            <h3 
              className="mb-4 font-head text-sm font-semibold"
              style={{ color: 'var(--color-theme-text-primary)' }}
            >
              Performance par cluster
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {kpis.performance.clusterPerformance.map((cluster) => {
                const percent = cluster.objective > 0 ? (cluster.achieved / cluster.objective) : 0;
                const getColor = () => {
                  if (percent >= 0.8) return 'var(--color-theme-success)';
                  if (percent >= 0.5) return 'var(--color-theme-warning)';
                  return 'var(--color-theme-danger)';
                };
                return (
                  <div 
                    key={cluster.clusterId} 
                    className="rounded-lg border p-4"
                    style={{ 
                      backgroundColor: 'var(--color-theme-surface)',
                      borderColor: 'var(--color-theme-border)'
                    }}
                  >
                    <div 
                      className="font-medium"
                      style={{ color: 'var(--color-theme-text-primary)' }}
                    >
                      {cluster.clusterName}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span 
                        className="text-sm"
                        style={{ color: 'var(--color-theme-text-secondary)' }}
                      >
                        {cluster.achieved} / {cluster.objective}
                      </span>
                      <span 
                        className="text-sm font-bold"
                        style={{ color: getColor() }}
                      >
                        {cluster.objective > 0 ? Math.round(percent * 100) : 0}%
                      </span>
                    </div>
                    <div 
                      className="mt-2 h-2 w-full rounded-full"
                      style={{ backgroundColor: 'var(--color-theme-neutral-light)' }}
                    >
                      <div 
                        className="h-2 rounded-full"
                        style={{ 
                          width: `${Math.min(percent * 100, 100)}%`,
                          backgroundColor: getColor()
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. Qualité */}
      <div>
        <h2 
          className="mb-4 font-head text-sm font-semibold uppercase tracking-wider"
          style={{ color: 'var(--color-theme-text-secondary)' }}
        >
          Qualité
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <KpiCard 
            label="Dossiers soumis" 
            value={kpis?.quality.filesSubmitted || 0} 
            icon={<RiBarChartLine />} 
            variant="primary" 
          />
          <KpiCard 
            label="Dossiers validés" 
            value={kpis?.quality.filesValidated || 0} 
            icon={<RiCheckboxCircleLine />} 
            variant="success" 
          />
          <KpiCard 
            label="Dossiers rejetés" 
            value={kpis?.quality.filesRejected || 0} 
            icon={<RiArrowDownLine />} 
            variant="danger" 
          />
        </div>
      </div>

      {/* 4. Pilotage */}
      <div>
        <h2 
          className="mb-4 font-head text-sm font-semibold uppercase tracking-wider"
          style={{ color: 'var(--color-theme-text-secondary)' }}
        >
          Pilotage
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Score global */}
          <div 
            className="rounded-xl border p-5"
            style={{ 
              backgroundColor: 'var(--color-theme-surface)',
              borderColor: 'var(--color-theme-border)'
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div 
                  className="text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: 'var(--color-theme-text-secondary)' }}
                >
                  Score global
                </div>
                <div 
                  className="mt-2 font-head text-4xl font-bold"
                  style={{ color: 'var(--color-theme-text-primary)' }}
                >
                  {kpis?.pilotage.globalScore ?? 0}/100
                </div>
              </div>
              <div 
                className="h-16 w-16 rounded-full flex items-center justify-center"
                style={{ 
                  backgroundColor: (kpis?.pilotage.globalScore ?? 0) >= 70 
                    ? 'var(--color-theme-success-light)' 
                    : (kpis?.pilotage.globalScore ?? 0) >= 50 
                      ? 'var(--color-theme-warning-light)' 
                      : 'var(--color-theme-danger-light)'
                }}
              >
                <RiTrophyLine 
                  className="text-3xl"
                  style={{ 
                    color: (kpis?.pilotage.globalScore ?? 0) >= 70 
                      ? 'var(--color-theme-success)' 
                      : (kpis?.pilotage.globalScore ?? 0) >= 50 
                        ? 'var(--color-theme-warning)' 
                        : 'var(--color-theme-danger)'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Zones couvertes */}
          <div 
            className="rounded-xl border p-5"
            style={{ 
              backgroundColor: 'var(--color-theme-surface)',
              borderColor: 'var(--color-theme-border)'
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div 
                  className="text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: 'var(--color-theme-text-secondary)' }}
                >
                  Zones couvertes
                </div>
                <div 
                  className="mt-2 font-head text-4xl font-bold"
                  style={{ color: 'var(--color-theme-text-primary)' }}
                >
                  {kpis?.pilotage.coveredZones || 0}
                </div>
              </div>
              <div 
                className="h-16 w-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-theme-primary-light)' }}
              >
                <RiMapPinLine 
                  className="text-3xl"
                  style={{ color: 'var(--color-theme-primary)' }}
                />
              </div>
            </div>
          </div>

          {/* Alertes */}
          <div 
            className="rounded-xl border p-5"
            style={{ 
              backgroundColor: 'var(--color-theme-surface)',
              borderColor: 'var(--color-theme-border)'
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div 
                  className="text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: 'var(--color-theme-text-secondary)' }}
                >
                  Alertes
                </div>
                <div 
                  className="mt-2 font-head text-4xl font-bold"
                  style={{ color: 'var(--color-theme-text-primary)' }}
                >
                  {kpis?.pilotage.mainAlerts?.length || 0}
                </div>
              </div>
              <div 
                className="h-16 w-16 rounded-full flex items-center justify-center"
                style={{ 
                  backgroundColor: (kpis?.pilotage.mainAlerts?.length || 0) > 0 
                    ? 'var(--color-theme-danger-light)' 
                    : 'var(--color-theme-success-light)'
                }}
              >
                <RiAlertLine 
                  className="text-3xl"
                  style={{ 
                    color: (kpis?.pilotage.mainAlerts?.length || 0) > 0 
                      ? 'var(--color-theme-danger)' 
                      : 'var(--color-theme-success)'
                  }}
                />
              </div>
            </div>
            {kpis?.pilotage.mainAlerts && kpis.pilotage.mainAlerts.length > 0 && (
              <div className="mt-3 space-y-2">
                {kpis.pilotage.mainAlerts.slice(0, 3).map((alert, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center gap-2 text-xs"
                    style={{ color: 'var(--color-theme-text-secondary)' }}
                  >
                    <RiAlertLine style={{ color: 'var(--color-theme-warning)' }} />
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

function KpiCard({ label, value, icon, variant = 'primary', suffix }: { 
  label: string; 
  value: number; 
  icon: React.ReactNode; 
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  suffix?: string;
}) {
  const bgStyles: Record<string, React.CSSProperties> = {
    primary: { backgroundColor: 'var(--color-theme-primary-light)' },
    success: { backgroundColor: 'var(--color-theme-success-light)' },
    warning: { backgroundColor: 'var(--color-theme-warning-light)' },
    danger: { backgroundColor: 'var(--color-theme-danger-light)' },
    neutral: { backgroundColor: 'var(--color-theme-neutral-light)' },
  };

  const iconStyles: Record<string, React.CSSProperties> = {
    primary: { color: 'var(--color-theme-primary)' },
    success: { color: 'var(--color-theme-success)' },
    warning: { color: 'var(--color-theme-warning)' },
    danger: { color: 'var(--color-theme-danger)' },
    neutral: { color: 'var(--color-theme-neutral)' },
  };

  return (
    <div 
      className="relative overflow-hidden rounded-xl border p-5"
      style={{ 
        backgroundColor: 'var(--color-theme-surface)',
        borderColor: 'var(--color-theme-border)'
      }}
    >
      <div 
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg text-[17px]"
        style={{ ...bgStyles[variant], ...iconStyles[variant] }}
      >
        {icon}
      </div>
      <div 
        className="text-[11px] font-semibold uppercase tracking-wide"
        style={{ color: 'var(--color-theme-text-secondary)' }}
      >
        {label}
      </div>
      <div 
        className="mt-2 font-head text-3xl font-bold"
        style={{ color: 'var(--color-theme-text-primary)' }}
      >
        {value.toLocaleString('fr-FR')}{suffix || ''}
      </div>
    </div>
  );
}
