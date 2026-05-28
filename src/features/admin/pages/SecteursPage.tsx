import { useState, useEffect } from 'react';
import { RiLoader4Line } from '@/common/icons';
import api from '@/common/services/api';

interface Secteur {
  id: string;
  name: string;
  zone: { id: string; name: string };
  supervisor?: { id: string; fullName: string; matricule: string } | null;
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
  const [showCreate, setShowCreate] = useState(false);
  const [editSecteur, setEditSecteur] = useState<Secteur | null>(null);

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
      setSecteurs(res.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce secteur ?')) return;
    try {
      await api.delete(`/secteurs/${id}`);
      loadSecteurs();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur');
    }
  };

  return (
    <div>
      {/* Zone filter + create btn */}
      <div className="mb-4 flex items-center gap-3">
        <select
          value={selectedZone}
          onChange={(e) => setSelectedZone(e.target.value)}
          className="rounded-full border border-[#1D9E75] bg-[#1D9E75] px-4 py-2 text-xs font-medium text-white"
        >
          {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
        </select>
        <button onClick={() => setShowCreate(true)} className="ml-auto rounded-lg bg-[#1D9E75] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#0F6E56]">
          + Creer un secteur
        </button>
      </div>

      <div className="grid grid-cols-[1.5fr_1fr] gap-4">
        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-k2l-gray-200 bg-white">
          {loading ? (
            <div className="flex items-center justify-center py-12"><RiLoader4Line className="animate-spin text-2xl text-[#1D9E75]" /></div>
          ) : (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-k2l-gray-200">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-k2l-gray-400">Secteur</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-k2l-gray-400">Superviseur</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-k2l-gray-400">Quartiers</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-k2l-gray-400">Commerciaux</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {secteurs.map((s) => (
                  <tr key={s.id} className="border-b border-k2l-gray-100 last:border-b-0">
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3">
                      {s.supervisor ? (
                        <span className="flex items-center gap-1.5">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E1F5EE] text-[10px] font-bold text-[#0F6E56] font-head">
                            {s.supervisor.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </span>
                          {s.supervisor.fullName}
                        </span>
                      ) : <span className="text-k2l-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3 font-head font-semibold">{s._count.quartiers}</td>
                    <td className="px-4 py-3 font-head font-semibold">{s._count.members}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(s.id)} className="text-[11px] text-k2l-red hover:underline">Suppr.</button>
                    </td>
                  </tr>
                ))}
                {secteurs.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-k2l-gray-400">Aucun secteur dans cette zone</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Create/Edit form */}
        {(showCreate || editSecteur) && selectedZone && (
          <SecteurForm
            secteur={editSecteur}
            zoneId={selectedZone}
            supervisors={supervisors.filter((s) => !secteurs.some((sec) => sec.id !== editSecteur?.id && sec.supervisor?.id === s.id))}
            onSaved={() => { setShowCreate(false); setEditSecteur(null); loadSecteurs(); }}
            onCancel={() => { setShowCreate(false); setEditSecteur(null); }}
          />
        )}
        {!showCreate && !editSecteur && (
          <div className="rounded-xl border border-k2l-gray-200 bg-white p-5">
            <h3 className="mb-3 font-head text-sm font-semibold">Modifier un secteur</h3>
            <p className="text-[12px] text-k2l-gray-400 mb-3">Cliquez pour editer et assigner un superviseur.</p>
            {secteurs.map((s) => (
              <button key={s.id} onClick={() => setEditSecteur(s)} className="mb-1.5 w-full text-left rounded-lg border border-k2l-gray-200 px-3 py-2 text-[12px] hover:bg-[#E1F5EE] transition-colors">
                <span className="font-medium">{s.name}</span>
                <span className="ml-2 text-k2l-gray-400">{s.supervisor ? s.supervisor.fullName : 'Sans superviseur'}</span>
              </button>
            ))}
            {secteurs.length === 0 && <p className="text-k2l-gray-400 text-[12px]">Aucun secteur</p>}
          </div>
        )}
      </div>
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
