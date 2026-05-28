import { useState, useEffect } from 'react';
import { RiLoader4Line } from '@/common/icons';
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
  const [showCreate, setShowCreate] = useState(false);
  const [editZone, setEditZone] = useState<Zone | null>(null);

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

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette zone ?')) return;
    try {
      await api.delete(`/zones/${id}`);
      loadData();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><RiLoader4Line className="animate-spin text-2xl text-[#1D9E75]" /></div>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[13px] text-k2l-gray-600">{zones.length} zones</p>
        <button onClick={() => setShowCreate(true)} className="rounded-lg bg-[#1D9E75] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#0F6E56]">
          + Creer une zone
        </button>
      </div>

      <div className="grid grid-cols-[1.5fr_1fr] gap-4">
        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-k2l-gray-200 bg-white">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-k2l-gray-200">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-k2l-gray-400">Zone</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-k2l-gray-400">Coordinateur</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-k2l-gray-400">Communes</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-k2l-gray-400">Secteurs</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {zones.map((z) => (
                <tr key={z.id} className="border-b border-k2l-gray-100 last:border-b-0">
                  <td className="px-4 py-3 font-medium">{z.name}</td>
                  <td className="px-4 py-3">
                    {z.coordinator ? (
                      <span className="flex items-center gap-1.5">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E1F5EE] text-[10px] font-bold text-[#0F6E56] font-head">
                          {z.coordinator.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </span>
                        {z.coordinator.fullName}
                      </span>
                    ) : <span className="text-k2l-gray-400">-</span>}
                  </td>
                  <td className="px-4 py-3 text-k2l-gray-600">{z.communes.map((c) => c.name).join(', ')}</td>
                  <td className="px-4 py-3 font-head font-semibold">{z._count.secteurs}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(z.id)} className="text-[11px] text-k2l-red hover:underline">Suppr.</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Create/Edit form */}
        {(showCreate || editZone) && (
          <ZoneForm
            zone={editZone}
            communes={communes.filter((c) => !zones.some((z) => z.id !== editZone?.id && z.communes.some((zc) => zc.id === c.id)))}
            coordinators={coordinators.filter((co) => !zones.some((z) => z.id !== editZone?.id && z.coordinator?.id === co.id))}
            onSaved={() => { setShowCreate(false); setEditZone(null); loadData(); }}
            onCancel={() => { setShowCreate(false); setEditZone(null); }}
          />
        )}
        {!showCreate && !editZone && (
          <div className="rounded-xl border border-k2l-gray-200 bg-white p-5">
            <h3 className="mb-3 font-head text-sm font-semibold">Actions</h3>
            <p className="text-[12px] text-k2l-gray-400 mb-3">Cliquez sur une zone pour l'editer et assigner un coordinateur.</p>
            {zones.map((z) => (
              <button key={z.id} onClick={() => setEditZone(z)} className="mb-1.5 w-full text-left rounded-lg border border-k2l-gray-200 px-3 py-2 text-[12px] hover:bg-[#E1F5EE] transition-colors">
                <span className="font-medium">{z.name}</span>
                <span className="ml-2 text-k2l-gray-400">{z.coordinator ? z.coordinator.fullName : 'Sans coordinateur'}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ZoneFormProps {
  zone: Zone | null;
  communes: Commune[];
  coordinators: Coordinator[];
  onSaved: () => void;
  onCancel: () => void;
}

function ZoneForm({ zone, communes, coordinators, onSaved, onCancel }: ZoneFormProps) {
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
      onSaved();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-k2l-gray-200 bg-white p-5">
      <h3 className="mb-4 font-head text-sm font-semibold">{zone ? 'Modifier la zone' : 'Creer une zone'}</h3>
      <div className="space-y-3 text-[13px]">
        <div>
          <label className="text-[12px] text-k2l-gray-400">Nom de la zone</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-k2l-gray-200 bg-k2l-gray-100 px-3 py-2.5 outline-none focus:border-[#1D9E75]" placeholder="Ex: Zone Centre" />
        </div>
        <div>
          <label className="text-[12px] text-k2l-gray-400">Coordinateur de la zone</label>
          <select value={coordinatorId} onChange={(e) => setCoordinatorId(e.target.value)} className="mt-1 w-full rounded-lg border border-k2l-gray-200 bg-k2l-gray-100 px-3 py-2.5 outline-none">
            <option value="">-- Aucun coordinateur --</option>
            {coordinators.map((co) => (
              <option key={co.id} value={co.id}>{co.fullName} ({co.matricule})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[12px] text-k2l-gray-400">Communes a regrouper</label>
          <div className="mt-1.5 flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
            {communes.map((c) => (
              <button type="button" key={c.id} onClick={() => toggleCommune(c.id)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold border transition-colors ${
                  selectedCommunes.includes(c.id) ? 'bg-[#E1F5EE] text-[#0F6E56] border-[#9FE1CB]' : 'bg-k2l-gray-100 text-k2l-gray-600 border-k2l-gray-200'
                }`}>
                {c.name} {selectedCommunes.includes(c.id) && '✕'}
              </button>
            ))}
            {communes.length === 0 && <span className="text-k2l-gray-400">Toutes les communes sont deja affectees</span>}
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onCancel} className="flex-1 rounded-lg border border-k2l-gray-200 py-2.5 text-[13px] font-semibold text-k2l-gray-600 hover:bg-k2l-gray-100">Annuler</button>
          <button type="submit" disabled={saving || !name} className="flex-1 rounded-lg bg-[#1D9E75] py-2.5 text-[13px] font-semibold text-white hover:bg-[#0F6E56] disabled:opacity-50">
            {saving ? 'Enregistrement...' : (zone ? 'Enregistrer' : 'Creer')}
          </button>
        </div>
      </div>
    </form>
  );
}
