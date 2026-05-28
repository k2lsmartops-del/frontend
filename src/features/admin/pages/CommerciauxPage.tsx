import { useState, useEffect, useCallback } from 'react';
import { RiSearchLine, RiLoader4Line, RiAddLine, RiEyeLine, RiEyeOffLine, RiRefreshLine } from 'react-icons/ri';
import api from '@/common/services/api';

interface Commercial {
  id: string;
  matricule: string;
  fullName: string;
  phone: string;
  email?: string;
  status: string;
  isActive: boolean;
  createdAt: string;
}

interface FormData {
  fullName: string;
  phone: string;
  email: string;
  password: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ACTIF: { label: 'Actif', color: 'bg-[#E1F5EE] text-[#0F6E56]' },
  DESACTIVE: { label: 'Désactivé', color: 'bg-k2l-gray-100 text-k2l-gray-600' },
  SUSPENDU: { label: 'Suspendu', color: 'bg-[#FAEEDA] text-[#B87514]' },
  EN_CONGE: { label: 'En congé', color: 'bg-[#E6F1FB] text-[#378ADD]' },
};

export default function CommerciauxPage() {
  const [commerciaux, setCommerciaux] = useState<Commercial[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({ fullName: '', phone: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const loadCommerciaux = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/users', { params: { role: 'COMMERCIAL' } });
      setCommerciaux(res.data.data || []);
    } catch {
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCommerciaux();
  }, [loadCommerciaux]);

  const filteredCommerciaux = commerciaux.filter((c) =>
    c.fullName.toLowerCase().includes(search.toLowerCase()) ||
    c.matricule.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await api.patch(`/users/${editingId}`, {
          fullName: formData.fullName,
          phone: formData.phone,
          email: formData.email || null,
        });
      } else {
        await api.post('/users', {
          ...formData,
          role: 'COMMERCIAL',
          email: formData.email || null,
        });
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ fullName: '', phone: '', email: '', password: '' });
      loadCommerciaux();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (c: Commercial) => {
    setEditingId(c.id);
    setFormData({ fullName: c.fullName, phone: c.phone, email: c.email || '', password: '' });
    setShowForm(true);
  };

  const handleToggleActive = async (c: Commercial) => {
    try {
      if (c.isActive) {
        await api.patch(`/users/${c.id}/deactivate`);
      } else {
        await api.patch(`/users/${c.id}/activate`);
      }
      loadCommerciaux();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur');
    }
  };

  const handleResetPassword = async (id: string) => {
    try {
      const res = await api.post(`/users/${id}/reset-password`);
      setTempPassword(res.data.temporaryPassword);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur');
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ fullName: '', phone: '', email: '', password: '' });
    setError('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-head text-xl font-bold text-k2l-gray-900">Mes Commerciaux</h1>
          <p className="text-sm text-k2l-gray-400">Gérez les commerciaux de votre équipe</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-[#1D9E75] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0F6E56]"
        >
          <RiAddLine className="text-lg" />
          Ajouter un commercial
        </button>
      </div>

      {/* Temp Password Modal */}
      {tempPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 font-head text-lg font-bold">Nouveau mot de passe</h3>
            <p className="mb-2 text-sm text-k2l-gray-600">Le mot de passe temporaire est :</p>
            <div className="mb-4 rounded-lg bg-k2l-gray-100 p-3 text-center font-mono text-lg font-bold text-[#1D9E75]">
              {tempPassword}
            </div>
            <p className="mb-4 text-xs text-k2l-gray-400">Communiquez ce mot de passe au commercial. Il devra le changer à sa prochaine connexion.</p>
            <button
              onClick={() => setTempPassword(null)}
              className="w-full rounded-lg bg-[#1D9E75] py-2.5 text-sm font-semibold text-white hover:bg-[#0F6E56]"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="rounded-xl border border-k2l-gray-200 bg-white p-5">
          <h3 className="mb-4 font-head text-sm font-semibold">
            {editingId ? 'Modifier le commercial' : 'Nouveau commercial'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs text-k2l-gray-400">Nom complet *</label>
                <input
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-k2l-gray-200 bg-k2l-gray-100 px-3 py-2.5 text-sm outline-none focus:border-[#1D9E75]"
                  placeholder="Jean Dupont"
                />
              </div>
              <div>
                <label className="text-xs text-k2l-gray-400">Téléphone *</label>
                <input
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-k2l-gray-200 bg-k2l-gray-100 px-3 py-2.5 text-sm outline-none focus:border-[#1D9E75]"
                  placeholder="0701020304"
                />
              </div>
              <div>
                <label className="text-xs text-k2l-gray-400">Email (optionnel)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-k2l-gray-200 bg-k2l-gray-100 px-3 py-2.5 text-sm outline-none focus:border-[#1D9E75]"
                  placeholder="jean@example.com"
                />
              </div>
              {!editingId && (
                <div>
                  <label className="text-xs text-k2l-gray-400">Mot de passe *</label>
                  <input
                    required
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-k2l-gray-200 bg-k2l-gray-100 px-3 py-2.5 text-sm outline-none focus:border-[#1D9E75]"
                    placeholder="••••••••"
                  />
                </div>
              )}
            </div>
            {error && <p className="text-sm text-[#E24B4A]">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={cancelForm}
                className="flex-1 rounded-lg border border-k2l-gray-200 py-2.5 text-sm font-semibold text-k2l-gray-600 hover:bg-k2l-gray-100"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg bg-[#1D9E75] py-2.5 text-sm font-semibold text-white hover:bg-[#0F6E56] disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : editingId ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-k2l-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un commercial..."
          className="w-full rounded-lg border border-k2l-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#1D9E75]"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-k2l-gray-200 bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RiLoader4Line className="animate-spin text-2xl text-[#1D9E75]" />
          </div>
        ) : filteredCommerciaux.length === 0 ? (
          <div className="py-12 text-center text-sm text-k2l-gray-400">
            {search ? 'Aucun résultat' : 'Aucun commercial dans votre équipe'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-k2l-gray-200 bg-k2l-gray-100/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-k2l-gray-400">Commercial</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-k2l-gray-400">Téléphone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-k2l-gray-400">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-k2l-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCommerciaux.map((c) => (
                <tr key={c.id} className="border-b border-k2l-gray-100 last:border-b-0 hover:bg-k2l-gray-100/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E1F5EE] text-xs font-bold text-[#0F6E56]">
                        {c.fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{c.fullName}</div>
                        <div className="text-xs text-k2l-gray-400">{c.matricule}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-k2l-gray-600">{c.phone}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_LABELS[c.status]?.color || 'bg-k2l-gray-100 text-k2l-gray-600'}`}>
                      {STATUS_LABELS[c.status]?.label || c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(c)}
                        className="rounded-lg p-2 text-k2l-gray-400 hover:bg-k2l-gray-100 hover:text-k2l-gray-600"
                        title="Modifier"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleToggleActive(c)}
                        className={`rounded-lg p-2 hover:bg-k2l-gray-100 ${c.isActive ? 'text-[#E24B4A]' : 'text-[#1D9E75]'}`}
                        title={c.isActive ? 'Désactiver' : 'Activer'}
                      >
                        {c.isActive ? <RiEyeOffLine className="h-4 w-4" /> : <RiEyeLine className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleResetPassword(c.id)}
                        className="rounded-lg p-2 text-k2l-gray-400 hover:bg-k2l-gray-100 hover:text-[#378ADD]"
                        title="Réinitialiser mot de passe"
                      >
                        <RiRefreshLine className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
