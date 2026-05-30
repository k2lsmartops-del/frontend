import { useState, useEffect, useMemo } from 'react';
import { RiLoader4Line, RiSearchLine, RiPencilLine, RiDeleteBinLine, RiMapPinLine, RiTeamLine, RiBriefcaseLine, RiLockLine } from 'react-icons/ri';
import api from '@/common/services/api';

interface Secteur {
  id: string;
  name: string;
  zone: { id: string; name: string };
  supervisor?: { id: string; fullName: string; matricule: string } | null;
  quartiers?: Quartier[];
  _count: { quartiers: number; members: number };
}

interface Zone { id: string; name: string; }
interface Quartier { id: string; name: string; commune: { id: string; name: string }; }
interface Supervisor { id: string; fullName: string; matricule: string; }

export default function SecteursPage() {
  const [secteurs, setSecteurs] = useState<Secteur[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editSecteur, setEditSecteur] = useState<Secteur | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'complete' | 'incomplete'>('all');

  useEffect(() => {
    loadZones();
  }, []);

  useEffect(() => {
    loadSecteurs();
  }, [selectedZone]);

  async function loadZones() {
    try {
      const [zRes, sRes] = await Promise.all([
        api.get('/zones'),
        api.get('/users?role=SUPERVISEUR&limit=100'),
      ]);
      setZones(zRes.data);
      setSupervisors(sRes.data.data || []);
      if (zRes.data.length > 0) setSelectedZone(zRes.data[0].id);
    } catch { /* ignore */ }
  }

  async function loadSecteurs() {
    if (!selectedZone) return;
    setLoading(true);
    try {
      const res = await api.get(`/secteurs?zoneId=${selectedZone}`);
      // Charger les détails de chaque secteur pour avoir les quartiers
      const secteursWithDetails = await Promise.all(
        res.data.map(async (s: Secteur) => {
          try {
            const detailRes = await api.get(`/secteurs/${s.id}`);
            return { ...s, quartiers: detailRes.data.quartiers || [] };
          } catch {
            return s;
          }
        })
      );
      setSecteurs(secteursWithDetails);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  // Fonction pour déterminer le statut d'un secteur
  const getSecteurStatus = (secteur: Secteur): 'ok' | 'warn' | 'danger' => {
    const hasSupervisor = !!secteur.supervisor;
    const hasQuartiers = secteur._count.quartiers > 0;
    
    if (hasSupervisor && hasQuartiers) return 'ok';
    if (hasQuartiers && !hasSupervisor) return 'warn';
    return 'danger';
  };

  // Secteurs filtrés par recherche et statut
  const filteredSecteurs = useMemo(() => {
    let result = secteurs;
    
    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((s) => 
        s.name.toLowerCase().includes(query) ||
        s.supervisor?.fullName.toLowerCase().includes(query)
      );
    }
    
    // Filtre par statut
    if (statusFilter === 'complete') {
      result = result.filter((s) => getSecteurStatus(s) === 'ok');
    } else if (statusFilter === 'incomplete') {
      result = result.filter((s) => getSecteurStatus(s) !== 'ok');
    }
    
    return result;
  }, [secteurs, searchQuery, statusFilter]);

  // KPIs calculés
  const kpis = useMemo(() => {
    const totalSecteurs = secteurs.length;
    const assignedSupervisors = secteurs.filter((s) => s.supervisor).length;
    const totalQuartiers = secteurs.reduce((sum, s) => sum + s._count.quartiers, 0);
    const totalCommerciaux = secteurs.reduce((sum, s) => sum + s._count.members, 0);
    
    return { totalSecteurs, assignedSupervisors, totalQuartiers, totalCommerciaux };
  }, [secteurs]);

  // Infos de la zone sélectionnée
  const selectedZoneData = useMemo(() => {
    const zone = zones.find((z) => z.id === selectedZone);
    return zone;
  }, [zones, selectedZone]);

  const handleDelete = async (id: string, secteurName: string) => {
    if (!confirm(`Supprimer le secteur "${secteurName}" ?`)) return;
    try {
      await api.delete(`/secteurs/${id}`);
      loadSecteurs();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur';
      alert(message);
    }
  };

  const handleOpenModal = (secteur: Secteur | null) => {
    setEditSecteur(secteur);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditSecteur(null);
  };

  if (zones.length === 0 && !loading) {
    return (
      <div className="rounded-xl border border-k2l-gray-200 bg-white p-12 text-center">
        <p className="text-k2l-gray-400">Aucune zone disponible. Créez d'abord une zone.</p>
      </div>
    );
  }

  const completeCount = secteurs.filter((s) => getSecteurStatus(s) === 'ok').length;
  const incompleteCount = secteurs.filter((s) => getSecteurStatus(s) !== 'ok').length;

  return (
    <div>
      {/* Zone Pivot Banner */}
      <div className="mb-5 rounded-2xl border border-k2l-gray-200 border-l-[5px] border-l-[#1D9E75] bg-white p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-k2l-success-light text-2xl">
              🗂️
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-k2l-gray-400">Zone sélectionnée</p>
              <div className="mt-1">
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="rounded-lg border-none bg-transparent font-head text-lg font-bold text-k2l-gray-900 outline-none hover:bg-k2l-gray-100 px-2 py-1 cursor-pointer"
                >
                  {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-k2l-gray-600">
                <span className="flex items-center gap-1">
                  <RiMapPinLine /> {kpis.totalSecteurs} secteurs configurés
                </span>
                <span className="flex items-center gap-1">
                  <RiTeamLine /> {kpis.totalCommerciaux} commerciaux
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => handleOpenModal(null)}
            className="rounded-lg bg-[#1D9E75] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#0F6E56] transition-colors whitespace-nowrap"
          >
            + Créer un secteur
          </button>
        </div>
      </div>

      {/* Bandeau KPI */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <KpiCard
          label="Secteurs"
          value={kpis.totalSecteurs}
          icon={<RiMapPinLine />}
          color="green"
        />
        <KpiCard
          label="Superviseurs assignés"
          value={`${kpis.assignedSupervisors} / ${kpis.totalSecteurs}`}
          icon={<RiBriefcaseLine />}
          color={kpis.assignedSupervisors === kpis.totalSecteurs ? 'green' : 'amber'}
        />
        <KpiCard
          label="Quartiers affectés"
          value={kpis.totalQuartiers}
          icon={<RiMapPinLine />}
          color="amber"
        />
        <KpiCard
          label="Commerciaux"
          value={kpis.totalCommerciaux}
          icon={<RiTeamLine />}
          color="green"
        />
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Recherche */}
        <div className="flex items-center gap-2 rounded-lg border border-k2l-gray-200 bg-white px-3 py-2">
          <RiSearchLine className="text-sm text-k2l-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un secteur..."
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
            Tous ({secteurs.length})
          </button>
          <button
            onClick={() => setStatusFilter('complete')}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              statusFilter === 'complete'
                ? 'bg-[#1D9E75] text-white'
                : 'bg-white text-k2l-gray-600 border border-k2l-gray-200 hover:border-[#1D9E75]'
            }`}
          >
            Complets ({completeCount})
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
        </div>
      </div>

      {/* Grille de cartes */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RiLoader4Line className="animate-spin text-2xl text-[#1D9E75]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredSecteurs.map((secteur) => (
            <SecteurCard
              key={secteur.id}
              secteur={secteur}
              status={getSecteurStatus(secteur)}
              onEdit={() => handleOpenModal(secteur)}
              onDelete={() => handleDelete(secteur.id, secteur.name)}
            />
          ))}
          {filteredSecteurs.length === 0 && (
            <div className="col-span-2 rounded-xl border border-k2l-gray-200 bg-white p-12 text-center">
              <p className="text-k2l-gray-400">Aucun secteur trouvé</p>
            </div>
          )}
        </div>
      )}

      {/* Modale */}
      {showModal && selectedZone && (
        <SecteurFormModal
          secteur={editSecteur}
          zoneId={selectedZone}
          zoneName={selectedZoneData?.name || ''}
          supervisors={supervisors.filter((s) => !secteurs.some((sec) => sec.id !== editSecteur?.id && sec.supervisor?.id === s.id))}
          onSave={() => { handleCloseModal(); loadSecteurs(); }}
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

interface SecteurCardProps {
  secteur: Secteur;
  status: 'ok' | 'warn' | 'danger';
  onEdit: () => void;
  onDelete: () => void;
}

function SecteurCard({ secteur, status, onEdit, onDelete }: SecteurCardProps) {
  const statusConfig = {
    ok: {
      border: 'border-l-[#1D9E75]',
      badge: 'bg-k2l-success-light text-[#1D9E75]',
      label: '✓ Opérationnel',
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
      <h3 className="mb-3 font-head text-lg font-bold text-k2l-gray-900 pr-32">{secteur.name}</h3>

      {/* Superviseur */}
      {secteur.supervisor ? (
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E6F1FB] text-[11px] font-bold text-[#1F5C99] font-head">
            {secteur.supervisor.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-[13px] font-semibold text-k2l-gray-900">{secteur.supervisor.fullName}</p>
            <p className="text-[11px] text-k2l-gray-400">Superviseur · {secteur.supervisor.matricule}</p>
          </div>
        </div>
      ) : (
        <div className="mb-3 rounded-lg bg-k2l-red-light p-3">
          <p className="text-[12px] font-semibold text-[#E24B4A]">⚠️ Aucun superviseur — Cliquez pour en assigner un</p>
        </div>
      )}

      {/* Quartiers */}
      <div className="mb-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-k2l-gray-400 mb-2">
          Quartiers ({secteur._count.quartiers})
        </p>
        <div className="flex flex-wrap gap-1.5">
          {secteur.quartiers && secteur.quartiers.length > 0 ? (
            secteur.quartiers.map((q) => (
              <span key={q.id} className="inline-block rounded-full bg-[#E6F1FB] px-2.5 py-0.5 text-[11px] font-semibold text-[#1F5C99]">
                {q.name} · {q.commune.name}
              </span>
            ))
          ) : (
            <span className="text-[12px] text-k2l-gray-400">Aucun quartier</span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-[12px] text-k2l-gray-600 pt-3 border-t border-dashed border-k2l-gray-200">
        <span className="flex items-center gap-1">
          <RiMapPinLine className="text-sm" />
          <strong>{secteur._count.quartiers}</strong> quartiers
        </span>
        <span className="flex items-center gap-1">
          <RiTeamLine className="text-sm" />
          <strong>{secteur._count.members}</strong> commerciaux
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

interface SecteurFormModalProps {
  secteur: Secteur | null;
  zoneId: string;
  zoneName: string;
  supervisors: Supervisor[];
  onSave: () => void;
  onClose: () => void;
}

function SecteurFormModal({ secteur, zoneId, zoneName, supervisors, onSave, onClose }: SecteurFormModalProps) {
  const [name, setName] = useState(secteur?.name || '');
  const [supervisorId, setSupervisorId] = useState(secteur?.supervisor?.id || '');
  const [quartiers, setQuartiers] = useState<Quartier[]>([]);
  const [currentQuartiers, setCurrentQuartiers] = useState<Quartier[]>([]);
  const [selectedQuartiers, setSelectedQuartiers] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingQuartiers, setLoadingQuartiers] = useState(true);

  useEffect(() => {
    const loadQuartiers = async () => {
      setLoadingQuartiers(true);
      try {
        // Charger les quartiers disponibles (non assignés)
        const availableRes = await api.get(`/zones/${zoneId}/quartiers-disponibles`);
        const available: Quartier[] = availableRes.data;

        // Si on édite un secteur, charger aussi ses quartiers actuels
        if (secteur) {
          const secteurRes = await api.get(`/secteurs/${secteur.id}`);
          const current: Quartier[] = secteurRes.data.quartiers || [];
          setCurrentQuartiers(current);
          setSelectedQuartiers(current.map((q: Quartier) => q.id));
          // Fusionner : disponibles + actuels du secteur
          const allQuartiers = [...available, ...current];
          // Dédupliquer par id
          const unique = allQuartiers.filter((q, i, arr) => arr.findIndex((x) => x.id === q.id) === i);
          setQuartiers(unique);
        } else {
          setQuartiers(available);
        }
      } catch { /* ignore */ }
      finally { setLoadingQuartiers(false); }
    };
    loadQuartiers();
  }, [zoneId, secteur]);

  const toggleQuartier = (id: string) => {
    setSelectedQuartiers((prev) => prev.includes(id) ? prev.filter((q) => q !== id) : [...prev, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name, supervisorId: supervisorId || null, quartierIds: selectedQuartiers.length > 0 ? selectedQuartiers : undefined };
      if (secteur) {
        await api.patch(`/secteurs/${secteur.id}`, payload);
      } else {
        await api.post('/secteurs', { ...payload, zoneId });
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
        className="w-full max-w-[540px] rounded-2xl bg-white p-6 shadow-2xl animate-slideUp max-h-[90vh] overflow-y-auto"
      >
        <h2 className="mb-2 font-head text-xl font-bold text-k2l-gray-900">
          {secteur ? 'Modifier le secteur' : 'Créer un secteur'}
        </h2>
        <p className="mb-5 text-xs text-k2l-gray-400">
          Définissez le nom, sa zone, les quartiers couverts et son superviseur.
        </p>

        <div className="space-y-4 text-[13px]">
          {/* Nom */}
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-k2l-gray-600">Nom du secteur</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-k2l-gray-200 px-3 py-2.5 outline-none focus:border-[#1D9E75] transition-colors"
              placeholder="Ex: Secteur 5"
            />
          </div>

          {/* Zone (locked) */}
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-k2l-gray-600">Zone</label>
            <div className="flex items-center gap-2 rounded-lg border-2 border-dashed border-k2l-gray-200 bg-k2l-gray-100 px-3 py-2.5 text-k2l-gray-600">
              <RiLockLine className="text-sm" />
              <span className="text-[12px]">{zoneName} (sélectionnée plus haut)</span>
            </div>
          </div>

          {/* Superviseur */}
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-k2l-gray-600">Superviseur</label>
            <select
              value={supervisorId}
              onChange={(e) => setSupervisorId(e.target.value)}
              className="w-full rounded-lg border border-k2l-gray-200 px-3 py-2.5 outline-none focus:border-[#1D9E75] transition-colors"
            >
              <option value="">-- Aucun superviseur --</option>
              {supervisors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.matricule})
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-k2l-gray-400">Seuls les superviseurs sans secteur sont proposés.</p>
          </div>

          {/* Quartiers */}
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-k2l-gray-600">Quartiers à affecter</label>
            {loadingQuartiers ? (
              <div className="text-center text-k2l-gray-400 text-[12px] py-4">Chargement...</div>
            ) : (
              <div className="max-h-40 overflow-y-auto rounded-lg border border-k2l-gray-200 p-3">
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(
                    quartiers.reduce((acc, q) => {
                      const communeName = q.commune.name;
                      if (!acc[communeName]) acc[communeName] = [];
                      acc[communeName].push(q);
                      return acc;
                    }, {} as Record<string, Quartier[]>)
                  ).map(([communeName, communeQuartiers]) => (
                    <div key={communeName} className="w-full mb-2">
                      <div className="text-[10px] font-semibold text-k2l-gray-500 mb-1">{communeName}</div>
                      <div className="flex flex-wrap gap-1">
                        {communeQuartiers.map((q) => {
                          const isSelected = selectedQuartiers.includes(q.id);
                          const isCurrent = currentQuartiers.some((cq) => cq.id === q.id);
                          return (
                            <button
                              type="button"
                              key={q.id}
                              onClick={() => toggleQuartier(q.id)}
                              className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all ${
                                isSelected
                                  ? 'bg-[#E1F5EE] text-[#0F6E56] border-2 border-[#1D9E75]'
                                  : 'bg-k2l-gray-100 text-k2l-gray-600 border-2 border-transparent hover:border-k2l-gray-300'
                              }`}
                            >
                              {q.name} {isSelected && '✓'}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {quartiers.length === 0 && (
                    <span className="text-k2l-gray-400">Aucun quartier disponible</span>
                  )}
                </div>
              </div>
            )}
            <p className="mt-1 text-[11px] text-k2l-gray-400">Les quartiers barrés sont déjà affectés à un autre secteur de la zone.</p>
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
            {saving ? 'Enregistrement...' : secteur ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </form>
    </div>
  );
}

interface SecteurFormProps {
  secteur: Secteur | null;
  zoneId: string;
  supervisors: Supervisor[];
  onSaved: () => void;
  onCancel: () => void;
}

function SecteurForm({ secteur, zoneId, supervisors, onSaved, onCancel }: SecteurFormProps) {
  const [name, setName] = useState(secteur?.name || '');
  const [supervisorId, setSupervisorId] = useState(secteur?.supervisor?.id || '');
  const [quartiers, setQuartiers] = useState<Quartier[]>([]);
  const [currentQuartiers, setCurrentQuartiers] = useState<Quartier[]>([]);
  const [selectedQuartiers, setSelectedQuartiers] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingQuartiers, setLoadingQuartiers] = useState(true);

  useEffect(() => {
    const loadQuartiers = async () => {
      setLoadingQuartiers(true);
      try {
        // Charger les quartiers disponibles (non assignés)
        const availableRes = await api.get(`/zones/${zoneId}/quartiers-disponibles`);
        const available: Quartier[] = availableRes.data;

        // Si on édite un secteur, charger aussi ses quartiers actuels
        if (secteur) {
          const secteurRes = await api.get(`/secteurs/${secteur.id}`);
          const current: Quartier[] = secteurRes.data.quartiers || [];
          setCurrentQuartiers(current);
          setSelectedQuartiers(current.map((q: Quartier) => q.id));
          // Fusionner : disponibles + actuels du secteur
          const allQuartiers = [...available, ...current];
          // Dédupliquer par id
          const unique = allQuartiers.filter((q, i, arr) => arr.findIndex((x) => x.id === q.id) === i);
          setQuartiers(unique);
        } else {
          setQuartiers(available);
        }
      } catch { /* ignore */ }
      finally { setLoadingQuartiers(false); }
    };
    loadQuartiers();
  }, [zoneId, secteur]);

  const toggleQuartier = (id: string) => {
    setSelectedQuartiers((prev) => prev.includes(id) ? prev.filter((q) => q !== id) : [...prev, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name, supervisorId: supervisorId || null, quartierIds: selectedQuartiers.length > 0 ? selectedQuartiers : undefined };
      if (secteur) {
        await api.patch(`/secteurs/${secteur.id}`, payload);
      } else {
        await api.post('/secteurs', { ...payload, zoneId });
      }
      onSaved();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-k2l-gray-200 bg-white p-5">
      <h3 className="mb-4 font-head text-sm font-semibold">{secteur ? 'Modifier le secteur' : 'Creer un secteur'}</h3>
      <div className="space-y-3 text-[13px]">
        <div>
          <label className="text-[12px] text-k2l-gray-400">Nom du secteur</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-k2l-gray-200 bg-k2l-gray-100 px-3 py-2.5 outline-none focus:border-[#1D9E75]" placeholder="Ex: Secteur 5" />
        </div>
        <div>
          <label className="text-[12px] text-k2l-gray-400">Superviseur du secteur</label>
          <select value={supervisorId} onChange={(e) => setSupervisorId(e.target.value)} className="mt-1 w-full rounded-lg border border-k2l-gray-200 bg-k2l-gray-100 px-3 py-2.5 outline-none">
            <option value="">-- Aucun superviseur --</option>
            {supervisors.map((s) => (
              <option key={s.id} value={s.id}>{s.fullName} ({s.matricule})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[12px] text-k2l-gray-400">
            {secteur ? `Quartiers du secteur (${selectedQuartiers.length} sélectionné(s))` : `Quartiers disponibles (${quartiers.length})`}
          </label>
          {loadingQuartiers ? (
            <div className="mt-2 text-center text-k2l-gray-400 text-[12px]">Chargement...</div>
          ) : (
            <div className="mt-1.5 max-h-56 overflow-y-auto space-y-2">
              {/* Grouper par commune */}
              {Object.entries(
                quartiers.reduce((acc, q) => {
                  const communeName = q.commune.name;
                  if (!acc[communeName]) acc[communeName] = [];
                  acc[communeName].push(q);
                  return acc;
                }, {} as Record<string, Quartier[]>)
              ).map(([communeName, communeQuartiers]) => (
                <div key={communeName}>
                  <div className="text-[10px] font-semibold text-k2l-gray-500 mb-1">{communeName} ({communeQuartiers.length})</div>
                  <div className="flex flex-wrap gap-1">
                    {communeQuartiers.map((q) => {
                      const isSelected = selectedQuartiers.includes(q.id);
                      const isCurrent = currentQuartiers.some((cq) => cq.id === q.id);
                      return (
                        <button type="button" key={q.id} onClick={() => toggleQuartier(q.id)}
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold border transition-colors ${
                            isSelected 
                              ? 'bg-[#E1F5EE] text-[#0F6E56] border-[#9FE1CB]' 
                              : isCurrent 
                                ? 'bg-k2l-amber/10 text-k2l-amber border-k2l-amber/30'
                                : 'bg-k2l-gray-100 text-k2l-gray-600 border-k2l-gray-200'
                          }`}>
                          {q.name} {isSelected && '✕'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {quartiers.length === 0 && <span className="text-k2l-gray-400">Aucun quartier disponible</span>}
            </div>
          )}
        </div>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onCancel} className="flex-1 rounded-lg border border-k2l-gray-200 py-2.5 text-[13px] font-semibold text-k2l-gray-600 hover:bg-k2l-gray-100">Annuler</button>
          <button type="submit" disabled={saving || !name} className="flex-1 rounded-lg bg-[#1D9E75] py-2.5 text-[13px] font-semibold text-white hover:bg-[#0F6E56] disabled:opacity-50">
            {saving ? 'Enregistrement...' : (secteur ? 'Enregistrer' : 'Creer')}
          </button>
        </div>
      </div>
    </form>
  );
}
