import { useState, useEffect, useCallback } from 'react';
import { RiLoader4Line, RiAddLine, RiCloseLine, RiDeleteBinLine, RiEditLine, RiEyeLine, RiEyeOffLine } from 'react-icons/ri';
import api from '@/common/services/api';

interface TeamMember {
  id: string;
  fullName: string;
  matricule: string;
  status: string;
  phone?: string;
  email?: string;
  submissionCount?: number;
  validatedCount?: number;
  lastActivity?: string;
}

interface FormData {
  fullName: string;
  phone: string;
  email: string;
  password: string;
}

type Filter = 'all' | 'active' | 'inactive';

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({ fullName: '', phone: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const loadTeam = useCallback(async () => {
    try {
      const { data } = await api.get('/users/team');
      setMembers(data || []);
    } catch {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const filtered = members.filter((m) => {
    if (filter === 'active') return m.status === 'ACTIF';
    if (filter === 'inactive') return m.status !== 'ACTIF';
    return true;
  });

  const activeCount = members.filter((m) => m.status === 'ACTIF').length;
  const inactiveCount = members.length - activeCount;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIF': return 'bg-k2l-success';
      case 'SUSPENDU': return 'bg-k2l-amber';
      default: return 'bg-k2l-red';
    }
  };

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return '—';
    const now = new Date();
    const diff = now.getTime() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `il y a ${hours}h`;
    return `il y a ${Math.floor(hours / 24)}j`;
  };

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
      loadTeam();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (m: TeamMember) => {
    setEditingId(m.id);
    setFormData({ fullName: m.fullName, phone: m.phone || '', email: m.email || '', password: '' });
    setShowForm(true);
    setError('');
  };

  const handleRemove = async (id: string) => {
    try {
      await api.patch(`/users/${id}/remove-from-team`);
      setConfirmRemove(null);
      loadTeam();
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
    <div className="min-h-full bg-k2l-gray-100">
      {/* Header */}
      <div className="bg-k2l-navy px-5 py-4">
        <div className="flex items-center justify-between">
          <span className="font-head text-[15px] font-semibold text-white">Mon équipe</span>
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setFormData({ fullName: '', phone: '', email: '', password: '' }); }}
            className="flex items-center gap-1 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-medium text-white"
          >
            <RiAddLine /> Ajouter
          </button>
        </div>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="mx-4 mt-4 rounded-xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-head text-sm font-semibold">
              {editingId ? 'Modifier le commercial' : 'Nouveau commercial'}
            </span>
            <button onClick={cancelForm} className="text-k2l-gray-400">
              <RiCloseLine className="text-xl" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-[11px] text-k2l-gray-400">Nom complet *</label>
              <input
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="mt-1 w-full rounded-lg border border-k2l-gray-200 bg-k2l-gray-100 px-3 py-2.5 text-sm outline-none focus:border-k2l-primary"
                placeholder="Jean Dupont"
              />
            </div>
            <div>
              <label className="text-[11px] text-k2l-gray-400">Téléphone *</label>
              <input
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1 w-full rounded-lg border border-k2l-gray-200 bg-k2l-gray-100 px-3 py-2.5 text-sm outline-none focus:border-k2l-primary"
                placeholder="0701020304"
              />
            </div>
            <div>
              <label className="text-[11px] text-k2l-gray-400">Email (optionnel)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 w-full rounded-lg border border-k2l-gray-200 bg-k2l-gray-100 px-3 py-2.5 text-sm outline-none focus:border-k2l-primary"
                placeholder="jean@example.com"
              />
            </div>
            {!editingId && (
              <div>
                <label className="text-[11px] text-k2l-gray-400">Mot de passe *</label>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-k2l-gray-200 bg-k2l-gray-100 px-3 py-2.5 text-sm outline-none focus:border-k2l-primary pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[calc(50%+4px)] -translate-y-1/2 text-k2l-gray-400"
                  >
                    {showPassword ? <RiEyeOffLine className="text-lg" /> : <RiEyeLine className="text-lg" />}
                  </button>
                </div>
              </div>
            )}
            {error && <p className="text-xs text-k2l-red">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-k2l-primary py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : editingId ? 'Enregistrer' : 'Créer'}
            </button>
          </form>
        </div>
      )}

      {/* Confirmation suppression */}
      {confirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="w-full max-w-sm rounded-xl bg-white p-5">
            <h3 className="mb-2 font-head text-sm font-semibold">Retirer de l'équipe ?</h3>
            <p className="mb-4 text-xs text-k2l-gray-600">
              Ce commercial sera retiré de votre équipe mais son compte restera actif.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmRemove(null)}
                className="flex-1 rounded-lg border border-k2l-gray-200 py-2.5 text-sm font-medium text-k2l-gray-600"
              >
                Annuler
              </button>
              <button
                onClick={() => handleRemove(confirmRemove)}
                className="flex-1 rounded-lg bg-k2l-red py-2.5 text-sm font-semibold text-white"
              >
                Retirer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-2 overflow-x-auto px-4 py-3">
        <button
          onClick={() => setFilter('all')}
          className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
            filter === 'all'
              ? 'bg-k2l-success text-white'
              : 'border border-k2l-gray-200 bg-white text-k2l-gray-600'
          }`}
        >
          Tous ({members.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
            filter === 'active'
              ? 'bg-k2l-success text-white'
              : 'border border-k2l-gray-200 bg-white text-k2l-gray-600'
          }`}
        >
          Actifs ({activeCount})
        </button>
        <button
          onClick={() => setFilter('inactive')}
          className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
            filter === 'inactive'
              ? 'bg-k2l-success text-white'
              : 'border border-k2l-gray-200 bg-white text-k2l-gray-600'
          }`}
        >
          Inactifs ({inactiveCount})
        </button>
      </div>

      {/* Liste */}
      <div className="space-y-2 px-4 pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RiLoader4Line className="animate-spin text-2xl text-k2l-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center text-sm text-k2l-gray-400 shadow-sm">
            {members.length === 0 ? 'Aucun commercial dans votre équipe' : 'Aucun résultat pour ce filtre'}
          </div>
        ) : (
          filtered.map((member) => {
            const initials = member.fullName
              .split(' ')
              .map((w) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            const validationRate = member.submissionCount && member.validatedCount
              ? Math.round((member.validatedCount / member.submissionCount) * 100)
              : null;

            return (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm"
              >
                {/* Avatar avec indicateur statut */}
                <div className="relative">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full font-head text-sm font-bold ${
                    member.status === 'ACTIF' ? 'bg-k2l-success-light text-k2l-navy' : 'bg-k2l-gray-100 text-k2l-gray-600'
                  }`}>
                    {initials}
                  </div>
                  <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${getStatusColor(member.status)}`} />
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-medium text-k2l-gray-900">{member.fullName}</div>
                  <div className="text-[11px] text-k2l-gray-400">
                    {member.submissionCount ?? 0} soumissions · {formatTimeAgo(member.lastActivity)}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(member)}
                    className="rounded-lg p-2 text-k2l-gray-400 hover:bg-k2l-gray-100"
                  >
                    <RiEditLine className="text-lg" />
                  </button>
                  <button
                    onClick={() => setConfirmRemove(member.id)}
                    className="rounded-lg p-2 text-k2l-red hover:bg-k2l-red/10"
                  >
                    <RiDeleteBinLine className="text-lg" />
                  </button>
                </div>

                {/* Taux validation */}
                <div className="text-right">
                  <div className={`font-head text-sm font-bold ${validationRate !== null ? 'text-k2l-success' : 'text-k2l-gray-400'}`}>
                    {validationRate !== null ? `${validationRate}%` : '—'}
                  </div>
                  <div className="text-[9px] text-k2l-gray-400">validés</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
