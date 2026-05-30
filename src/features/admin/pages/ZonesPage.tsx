import { useState, useEffect, useMemo } from 'react';
import { RiLoader4Line, RiSearchLine, RiPencilLine, RiDeleteBinLine, RiMapPinLine, RiTeamLine } from 'react-icons/ri';
import api from '@/common/services/api';

interface Zone {
  id: string;
  name: string;
  description?: string;
  coordinator?: { id: string; fullName: string; matricule: string } | null;
  communes: { id: string; name: string }[];
  _count: { secteurs: number; members: number };
}

interface Commune { id: string; name: string; }
interface Coordinator { id: string; fullName: string; matricule: string; }

export default function ZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editZone, setEditZone] = useState<Zone | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'complete' | 'incomplete'>('all');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [zRes, cRes, uRes] = await Promise.all([
        api.get('/zones'),
        api.get('/communes'),
        api.get('/users?role=COORDINATEUR&limit=100'),
      ]);
      setZones(zRes.data);
      setCommunes(cRes.data);
      setCoordinators(uRes.data.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  // Fonction pour déterminer le statut d'une zone
  const getZoneStatus = (zone: Zone): 'ok' | 'warn' | 'danger' => {
    const hasCoordinator = !!zone.coordinator;
    const hasSecteurs = zone._count.secteurs > 0;
    
    if (hasCoordinator && hasSecteurs) return 'ok';
    if (hasSecteurs && !hasCoordinator) return 'warn';
    return 'danger';
  };

  // Zones filtrées par recherche et statut
  const filteredZones = useMemo(() => {
    let result = zones;
    
    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((z) => 
        z.name.toLowerCase().includes(query) ||
        z.coordinator?.fullName.toLowerCase().includes(query)
      );
    }
    
    // Filtre par statut
    if (statusFilter === 'complete') {
      result = result.filter((z) => getZoneStatus(z) === 'ok');
    } else if (statusFilter === 'incomplete') {
      result = result.filter((z) => getZoneStatus(z) !== 'ok');
    }
    
    return result;
  }, [zones, searchQuery, statusFilter]);

  // KPIs calculés
  const kpis = useMemo(() => {
    const totalZones = zones.length;
    const assignedCoordinators = zones.filter((z) => z.coordinator).length;
    const totalSecteurs = zones.reduce((sum, z) => sum + z._count.secteurs, 0);
    const totalCommerciaux = zones.reduce((sum, z) => sum + z._count.members, 0);
    
    return { totalZones, assignedCoordinators, totalSecteurs, totalCommerciaux };
  }, [zones]);

  const handleDelete = async (id: string, zoneName: string) => {
    if (!confirm(`Supprimer la zone "${zoneName}" ?`)) return;
    try {
      await api.delete(`/zones/${id}`);
      loadData();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur';
      alert(message);
    }
  };

  const handleOpenModal = (zone: Zone | null) => {
    setEditZone(zone);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditZone(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><RiLoader4Line className="animate-spin text-2xl text-[#1D9E75]" /></div>;
  }

  const completeCount = zones.filter((z) => getZoneStatus(z) === 'ok').length;
  const incompleteCount = zones.filter((z) => getZoneStatus(z) !== 'ok').length;

  return (
    <div>
      {/* Bandeau KPI */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard
          label="Zones créées"
          value={kpis.totalZones}
          icon={<RiMapPinLine />}
          color="blue"
        />
        <KpiCard
          label="Coordinateurs assignés"
          value={`${kpis.assignedCoordinators} / ${kpis.totalZones}`}
          icon={<RiTeamLine />}
          color={kpis.assignedCoordinators === kpis.totalZones ? 'green' : 'amber'}
        />
        <KpiCard
          label="Secteurs au total"
          value={kpis.totalSecteurs}
          icon={<RiMapPinLine />}
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
            placeholder="Rechercher une zone..."
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
            Toutes ({zones.length})
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
            + Créer une zone
          </button>
        </div>
      </div>

      {/* Grille de cartes */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filteredZones.map((zone) => (
          <ZoneCard
            key={zone.id}
            zone={zone}
            status={getZoneStatus(zone)}
            onEdit={() => handleOpenModal(zone)}
            onDelete={() => handleDelete(zone.id, zone.name)}
          />
        ))}
        {filteredZones.length === 0 && (
          <div className="col-span-2 rounded-xl border border-k2l-gray-200 bg-white p-12 text-center">
            <p className="text-k2l-gray-400">Aucune zone trouvée</p>
          </div>
        )}
      </div>

      {/* Modale */}
      {showModal && (
        <ZoneFormModal
          zone={editZone}
          communes={communes.filter((c) => !zones.some((z) => z.id !== editZone?.id && z.communes.some((zc) => zc.id === c.id)))}
          coordinators={coordinators.filter((co) => !zones.some((z) => z.id !== editZone?.id && z.coordinator?.id === co.id))}
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

interface ZoneCardProps {
  zone: Zone;
  status: 'ok' | 'warn' | 'danger';
  onEdit: () => void;
  onDelete: () => void;
}

function ZoneCard({ zone, status, onEdit, onDelete }: ZoneCardProps) {
  const statusConfig = {
    ok: {
      border: 'border-l-[#1D9E75]',
      badge: 'bg-k2l-success-light text-[#1D9E75]',
      label: '✓ Configurée',
    },
    warn: {
      border: 'border-l-[#EF9F27]',
      badge: 'bg-k2l-amber-light text-[#EF9F27]',
      label: '⚠ Coordinateur manquant',
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
      <h3 className="mb-3 font-head text-lg font-bold text-k2l-gray-900 pr-32">{zone.name}</h3>

      {/* Coordinateur */}
      {zone.coordinator ? (
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-k2l-success-light text-[11px] font-bold text-[#1D9E75] font-head">
            {zone.coordinator.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-[13px] font-semibold text-k2l-gray-900">{zone.coordinator.fullName}</p>
            <p className="text-[11px] text-k2l-gray-400">{zone.coordinator.matricule}</p>
          </div>
        </div>
      ) : (
        <div className="mb-3 rounded-lg bg-k2l-red-light p-3">
          <p className="text-[12px] font-semibold text-[#E24B4A]">⚠️ Aucun coordinateur — Cliquez pour en assigner un</p>
        </div>
      )}

      {/* Communes */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {zone.communes.map((c) => (
          <span key={c.id} className="inline-block rounded-full bg-[#E6F1FB] px-2.5 py-0.5 text-[11px] font-semibold text-[#1F5C99]">
            {c.name}
          </span>
        ))}
        {zone.communes.length === 0 && (
          <span className="text-[12px] text-k2l-gray-400">Aucune commune</span>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-[12px] text-k2l-gray-600">
        <span className="flex items-center gap-1">
          <RiMapPinLine className="text-sm" />
          <strong>{zone._count.secteurs}</strong> secteurs
        </span>
        <span className="flex items-center gap-1">
          <RiTeamLine className="text-sm" />
          <strong>{zone._count.members}</strong> commerciaux
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

interface ZoneFormModalProps {
  zone: Zone | null;
  communes: Commune[];
  coordinators: Coordinator[];
  onSave: () => void;
  onClose: () => void;
}

function ZoneFormModal({ zone, communes, coordinators, onSave, onClose }: ZoneFormModalProps) {
  const [name, setName] = useState(zone?.name || '');
  const [coordinatorId, setCoordinatorId] = useState(zone?.coordinator?.id || '');
  const [selectedCommunes, setSelectedCommunes] = useState<string[]>(zone?.communes.map((c) => c.id) || []);
  const [saving, setSaving] = useState(false);

  const toggleCommune = (id: string) => {
    setSelectedCommunes((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name, communeIds: selectedCommunes, coordinatorId: coordinatorId || null };
      if (zone) {
        await api.patch(`/zones/${zone.id}`, payload);
      } else {
        await api.post('/zones', payload);
      }
      onSave();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 animate-fadeIn" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[520px] rounded-2xl bg-white p-6 shadow-2xl animate-slideUp"
      >
        <h2 className="mb-5 font-head text-xl font-bold text-k2l-gray-900">
          {zone ? 'Modifier la zone' : 'Créer une zone'}
        </h2>

        <div className="space-y-4 text-[13px]">
          {/* Nom */}
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-k2l-gray-600">Nom de la zone</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-k2l-gray-200 px-3 py-2.5 outline-none focus:border-[#1D9E75] transition-colors"
              placeholder="Ex: Zone Centre"
            />
          </div>

          {/* Coordinateur */}
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-k2l-gray-600">Coordinateur de la zone</label>
            <select
              value={coordinatorId}
              onChange={(e) => setCoordinatorId(e.target.value)}
              className="w-full rounded-lg border border-k2l-gray-200 px-3 py-2.5 outline-none focus:border-[#1D9E75] transition-colors"
            >
              <option value="">-- Aucun coordinateur --</option>
              {coordinators.map((co) => (
                <option key={co.id} value={co.id}>
                  {co.fullName} ({co.matricule})
                </option>
              ))}
            </select>
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
            {saving ? 'Enregistrement...' : zone ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </form>
    </div>
  );
}
