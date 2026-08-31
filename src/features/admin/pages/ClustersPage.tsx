import { useState, useEffect, useMemo } from 'react';
import { RiLoader4Line, RiSearchLine, RiPencilLine, RiDeleteBinLine, RiMapPinLine, RiTeamLine } from 'react-icons/ri';
import api from '@/common/services/api';

interface Cluster {
  id: string;
  name: string;
  description?: string;
  supervisor?: { id: string; fullName: string; matricule: string } | null;
  communes: { id: string; name: string }[];
  _count: { members: number };
}

interface Commune { id: string; name: string; }
interface Coordinator { id: string; fullName: string; matricule: string; }

export default function ClustersPage() {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCluster, setEditCluster] = useState<Cluster | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'complete' | 'incomplete'>('all');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [cRes, commRes, uRes] = await Promise.all([
        api.get('/clusters'),
        api.get('/communes'),
        api.get('/users?role=SUPERVISEUR&limit=100'),
      ]);
      setClusters(cRes.data);
      setCommunes(commRes.data);
      setCoordinators(uRes.data.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  // Fonction pour déterminer le statut d'un cluster
  const getClusterStatus = (cluster: Cluster): 'ok' | 'warn' | 'danger' => {
    const hasSupervisor = !!cluster.supervisor;
    if (hasSupervisor) return 'ok';
    return 'danger';
  };

  // Clusters filtrés par recherche et statut
  const filteredClusters = useMemo(() => {
    let result = clusters;
    
    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((c) => 
        c.name.toLowerCase().includes(query) ||
        c.supervisor?.fullName.toLowerCase().includes(query)
      );
    }
    
    // Filtre par statut
    if (statusFilter === 'complete') {
      result = result.filter((c) => getClusterStatus(c) === 'ok');
    } else if (statusFilter === 'incomplete') {
      result = result.filter((c) => getClusterStatus(c) !== 'ok');
    }
    
    return result;
  }, [clusters, searchQuery, statusFilter]);

  // KPIs calculés
  const kpis = useMemo(() => {
    const totalClusters = clusters.length;
    const assignedSupervisors = clusters.filter((c) => c.supervisor).length;
    const totalCommerciaux = clusters.reduce((sum, c) => sum + c._count.members, 0);

    return { totalClusters, assignedSupervisors, totalCommerciaux };
  }, [clusters]);

  const handleDelete = async (id: string, clusterName: string) => {
    if (!confirm(`Supprimer le cluster "${clusterName}" ?`)) return;
    try {
      await api.delete(`/clusters/${id}`);
      loadData();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur';
      alert(message);
    }
  };

  const handleOpenModal = (cluster: Cluster | null) => {
    setEditCluster(cluster);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditCluster(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><RiLoader4Line className="animate-spin text-2xl text-[#1D9E75]" /></div>;
  }

  const completeCount = clusters.filter((c) => getClusterStatus(c) === 'ok').length;
  const incompleteCount = clusters.filter((c) => getClusterStatus(c) !== 'ok').length;

  return (
    <div>
      {/* Bandeau KPI */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard
          label="Clusters créés"
          value={kpis.totalClusters}
          icon={<RiMapPinLine />}
          color="blue"
        />
        <KpiCard
          label="Superviseurs assignés"
          value={`${kpis.assignedSupervisors} / ${kpis.totalClusters}`}
          icon={<RiTeamLine />}
          color={kpis.assignedSupervisors === kpis.totalClusters ? 'green' : 'amber'}
        />
        <KpiCard
          label="Commerciaux au total"
          value={kpis.totalCommerciaux}
          icon={<RiTeamLine />}
          color="blue"
        />
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Recherche */}
        <div className="flex items-center gap-2 rounded-lg border border-k2l-gray-200 bg-white px-3 py-2">
          <RiSearchLine className="text-sm text-k2l-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un cluster..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-k2l-gray-400 md:w-64"
          />
        </div>

        {/* Filtres */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              statusFilter === 'all'
                ? 'bg-[#1D9E75] text-white'
                : 'bg-white text-k2l-gray-600 border border-k2l-gray-200 hover:border-[#1D9E75]'
            }`}
          >
            Toutes ({clusters.length})
          </button>
          <button
            onClick={() => setStatusFilter('complete')}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              statusFilter === 'complete'
                ? 'bg-[#1D9E75] text-white'
                : 'bg-white text-k2l-gray-600 border border-k2l-gray-200 hover:border-[#1D9E75]'
            }`}
          >
            Complètes ({completeCount})
          </button>
          <button
            onClick={() => setStatusFilter('incomplete')}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              statusFilter === 'incomplete'
                ? 'bg-[#EF9F27] text-white'
                : 'bg-white text-k2l-gray-600 border border-k2l-gray-200 hover:border-[#EF9F27]'
            }`}
          >
            ⚠ À configurer ({incompleteCount})
          </button>

          <button
            onClick={() => handleOpenModal(null)}
            className="ml-auto rounded-lg bg-[#1D9E75] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#0F6E56] transition-colors"
          >
            + Créer un cluster
          </button>
        </div>
      </div>

      {/* Grille de cartes */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filteredClusters.map((cluster) => (
          <ClusterCard
            key={cluster.id}
            cluster={cluster}
            status={getClusterStatus(cluster)}
            onEdit={() => handleOpenModal(cluster)}
            onDelete={() => handleDelete(cluster.id, cluster.name)}
          />
        ))}
        {filteredClusters.length === 0 && (
          <div className="col-span-2 rounded-xl border border-k2l-gray-200 bg-white p-12 text-center">
            <p className="text-k2l-gray-400">Aucun cluster trouvé</p>
          </div>
        )}
      </div>

      {/* Modale */}
      {showModal && (
        <ClusterFormModal
          cluster={editCluster}
          communes={communes.filter((c) => !clusters.some((cl) => cl.id !== editCluster?.id && cl.communes.some((clc) => clc.id === c.id)))}
          supervisors={coordinators.filter((co) => !clusters.some((cl) => cl.id !== editCluster?.id && cl.supervisor?.id === co.id))}
          onSave={() => { handleCloseModal(); loadData(); }}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

/* ─── Composants ─── */

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'green' | 'amber' | 'blue';
}

function KpiCard({ label, value, icon, color }: KpiCardProps) {
  const colorClasses = {
    green: 'bg-k2l-success-light text-[#1D9E75]',
    amber: 'bg-k2l-amber-light text-[#EF9F27]',
    blue: 'bg-[#E6F1FB] text-[#1F5C99]',
  };

  return (
    <div className="relative rounded-xl border border-k2l-gray-200 bg-white p-5">
      <div className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-lg ${colorClasses[color]} text-xl`}>
        {icon}
      </div>
      <p className="text-xs font-medium text-k2l-gray-400 uppercase tracking-wider">{label}</p>
      <p className="mt-2 font-head text-3xl font-bold text-k2l-gray-900">{value}</p>
    </div>
  );
}

interface ClusterCardProps {
  cluster: Cluster;
  status: 'ok' | 'warn' | 'danger';
  onEdit: () => void;
  onDelete: () => void;
}

function ClusterCard({ cluster, status, onEdit, onDelete }: ClusterCardProps) {
  const statusConfig = {
    ok: {
      border: 'border-l-[#1D9E75]',
      badge: 'bg-k2l-success-light text-[#1D9E75]',
      label: '✓ Configurée',
    },
    warn: {
      border: 'border-l-[#EF9F27]',
      badge: 'bg-k2l-amber-light text-[#EF9F27]',
      label: '⚠ Superviseur manquant',
    },
    danger: {
      border: 'border-l-[#E24B4A]',
      badge: 'bg-k2l-red-light text-[#E24B4A]',
      label: '⛔ À configurer',
    },
  };

  const config = statusConfig[status];

  return (
    <div
      onClick={onEdit}
      className={`group relative cursor-pointer rounded-xl border-l-[5px] ${config.border} border-y border-r border-k2l-gray-200 bg-white p-5 transition-all hover:-translate-y-1 hover:shadow-lg`}
    >
      {/* Badge statut */}
      <div className="absolute right-4 top-4">
        <span className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-semibold ${config.badge}`}>
          {config.label}
        </span>
      </div>

      {/* Titre */}
      <h3 className="mb-3 font-head text-lg font-bold text-k2l-gray-900 pr-32">{cluster.name}</h3>

      {/* Superviseur */}
      {cluster.supervisor ? (
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-k2l-success-light text-[11px] font-bold text-[#1D9E75] font-head">
            {cluster.supervisor.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-[13px] font-semibold text-k2l-gray-900">{cluster.supervisor.fullName}</p>
            <p className="text-[11px] text-k2l-gray-400">{cluster.supervisor.matricule}</p>
          </div>
        </div>
      ) : (
        <div className="mb-3 rounded-lg bg-k2l-red-light p-3">
          <p className="text-[12px] font-semibold text-[#E24B4A]">⚠️ Aucun superviseur — Cliquez pour en assigner un</p>
        </div>
      )}

      {/* Communes */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {cluster.communes.map((c) => (
          <span key={c.id} className="inline-block rounded-full bg-[#E6F1FB] px-2.5 py-0.5 text-[11px] font-semibold text-[#1F5C99]">
            {c.name}
          </span>
        ))}
              </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-[12px] text-k2l-gray-600">
        <span className="flex items-center gap-1">
          <RiTeamLine className="text-sm" />
          <strong>{cluster._count.members}</strong> commerciaux
        </span>
      </div>

      {/* Actions (hover) */}
      <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1F5C99] text-white hover:bg-[#1F5C99]/90 transition-colors"
          title="Modifier"
        >
          <RiPencilLine />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E24B4A] text-white hover:bg-[#E24B4A]/90 transition-colors"
          title="Supprimer"
        >
          <RiDeleteBinLine />
        </button>
      </div>
    </div>
  );
}

interface ClusterFormModalProps {
  cluster: Cluster | null;
  communes: Commune[];
  supervisors: Coordinator[];
  onSave: () => void;
  onClose: () => void;
}

function ClusterFormModal({ cluster, communes, supervisors, onSave, onClose }: ClusterFormModalProps) {
  const [name, setName] = useState(cluster?.name || '');
  const [supervisorId, setSupervisorId] = useState(cluster?.supervisor?.id || '');
  const [selectedCommunes, setSelectedCommunes] = useState<string[]>(cluster?.communes.map((c) => c.id) || []);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const toggleCommune = (id: string) => {
    setSelectedCommunes((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage('');
    
    try {
      if (cluster) {
        // Mode édition : mettre à jour le cluster
        const payload = { name, communeIds: selectedCommunes };
        await api.patch(`/clusters/${cluster.id}`, payload);

        // Si le superviseur a changé, utiliser l'endpoint dédié
        const oldSupervisorId = cluster.supervisor?.id || '';
        if (supervisorId !== oldSupervisorId) {
          if (supervisorId) {
            // Assigner le nouveau superviseur (met à jour les commerciaux automatiquement)
            const res = await api.patch(`/clusters/${cluster.id}/supervisor`, { supervisorId });
            const data = res.data as { commerciauxUpdated?: number; newSupervisorName?: string };
            if (data.commerciauxUpdated && data.commerciauxUpdated > 0) {
              setSuccessMessage(`✅ ${data.newSupervisorName} assigné. ${data.commerciauxUpdated} commerciaux mis à jour.`);
              // Attendre un peu pour montrer le message
              await new Promise((resolve) => setTimeout(resolve, 1500));
            }
          } else {
            // Retirer le superviseur (si le cluster n'a pas de commerciaux actifs)
            try {
              await api.delete(`/clusters/${cluster.id}/supervisor`);
            } catch (err: unknown) {
              const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur';
              alert(message);
              setSaving(false);
              return;
            }
          }
        }
      } else {
        // Mode création
        const payload = { name, communeIds: selectedCommunes, supervisorId: supervisorId || null };
        await api.post('/clusters', payload);
      }
      onSave();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  // Inclure le superviseur actuel du cluster dans la liste des options
  const availableSupervisors = [...supervisors];
  if (cluster?.supervisor && !supervisors.some((s) => s.id === cluster.supervisor?.id)) {
    availableSupervisors.unshift(cluster.supervisor);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 animate-fadeIn" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[520px] rounded-2xl bg-white p-6 shadow-2xl animate-slideUp"
      >
        <h2 className="mb-5 font-head text-xl font-bold text-k2l-gray-900">
          {cluster ? 'Modifier le cluster' : 'Créer un cluster'}
        </h2>

        {/* Message de succès */}
        {successMessage && (
          <div className="mb-4 rounded-lg bg-k2l-success-light p-3 text-[13px] font-semibold text-[#1D9E75]">
            {successMessage}
          </div>
        )}

        <div className="space-y-4 text-[13px]">
          {/* Nom */}
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-k2l-gray-600">Nom du cluster</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-k2l-gray-200 px-3 py-2.5 outline-none focus:border-[#1D9E75] transition-colors"
              placeholder="Ex: Cluster Centre"
            />
          </div>

          {/* Superviseur */}
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-k2l-gray-600">
              Superviseur du cluster
              {cluster && cluster._count.members > 0 && (
                <span className="ml-2 text-[11px] text-k2l-gray-400">
                  ({cluster._count.members} commerciaux seront mis à jour)
                </span>
              )}
            </label>
            <select
              value={supervisorId}
              onChange={(e) => setSupervisorId(e.target.value)}
              className="w-full rounded-lg border border-k2l-gray-200 px-3 py-2.5 outline-none focus:border-[#1D9E75] transition-colors"
            >
              <option value="">-- Aucun superviseur --</option>
              {availableSupervisors.map((sup) => (
                <option key={sup.id} value={sup.id}>
                  {sup.fullName} ({sup.matricule})
                </option>
              ))}
            </select>
            {cluster && !supervisorId && cluster.supervisor && (
              <p className="mt-1 text-[11px] text-[#E24B4A]">
                ⚠️ Retirer le superviseur n'est possible que si le cluster n'a pas de commerciaux actifs.
              </p>
            )}
          </div>

          {/* Communes */}
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-k2l-gray-600">Communes à regrouper</label>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-k2l-gray-200 p-3">
              <div className="flex flex-wrap gap-1.5">
                {communes.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => toggleCommune(c.id)}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all ${
                      selectedCommunes.includes(c.id)
                        ? 'bg-[#E1F5EE] text-[#0F6E56] border-2 border-[#1D9E75]'
                        : 'bg-k2l-gray-100 text-k2l-gray-600 border-2 border-transparent hover:border-k2l-gray-300'
                    }`}
                  >
                    {c.name} {selectedCommunes.includes(c.id) && '✓'}
                  </button>
                ))}
                {communes.length === 0 && (
                  <span className="text-k2l-gray-400">Toutes les communes sont déjà affectées</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border-2 border-k2l-gray-200 py-2.5 text-[13px] font-semibold text-k2l-gray-600 hover:bg-k2l-gray-100 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving || !name}
            className="flex-1 rounded-lg bg-[#1D9E75] py-2.5 text-[13px] font-semibold text-white hover:bg-[#0F6E56] disabled:opacity-50 transition-colors"
          >
            {saving ? 'Enregistrement...' : cluster ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </form>
    </div>
  );
}
