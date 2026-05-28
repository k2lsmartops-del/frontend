import { useState, useEffect, useCallback } from 'react';
import { RiSearchLine, RiLoader4Line, RiEyeLine, RiEyeOffLine } from 'react-icons/ri';
import api from '@/common/services/api';
import { useAuthStore } from '@/common/stores/auth.store';

interface User {
  id: string;
  matricule: string;
  fullName: string;
  phone: string;
  role: string;
  status: string;
  isActive: boolean;
  zone?: {
    id: string;
    name: string;
    coordinator?: { id: string; fullName: string; matricule: string } | null;
  } | null;
  secteur?: { id: string; name: string } | null;
  supervisor?: { id: string; fullName: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface Zone {
  id: string;
  name: string;
}

const ROLE_BADGE: Record<string, string> = {
  ADMIN: 'bg-[#FCEBEB] text-[#A32D2D]',
  COORDINATEUR: 'bg-[#E6F1FB] text-[#1F5C99]',
  SUPERVISEUR: 'bg-[#E6F1FB] text-[#1F5C99]',
  COMMERCIAL: 'bg-k2l-gray-100 text-k2l-gray-600',
};

const STATUS_BADGE: Record<string, string> = {
  ACTIF: 'bg-[#E1F5EE] text-[#0F6E56]',
  SUSPENDU: 'bg-[#FAEEDA] text-[#854F0B]',
  EN_ATTENTE: 'bg-[#FAEEDA] text-[#854F0B]',
  DESACTIVE: 'bg-k2l-gray-100 text-k2l-gray-600',
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [zoneFilter, setZoneFilter] = useState<string>('');
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  // Charger les zones au montage
  useEffect(() => {
    api.get('/zones').then((res) => setZones(res.data || [])).catch(() => {});
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      if (zoneFilter) params.set('zoneId', zoneFilter);
      const res = await api.get(`/users?${params}`);
      setUsers(res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, zoneFilter]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleAction = async (userId: string, action: string) => {
    try {
      if (action === 'activate') await api.patch(`/users/${userId}/activate`);
      else if (action === 'deactivate') await api.patch(`/users/${userId}/deactivate`);
      else if (action === 'suspend') await api.patch(`/users/${userId}/suspend`);
      else if (action === 'reset') {
        const res = await api.post(`/users/${userId}/reset-password`);
        alert(`Nouveau mot de passe : ${res.data.temporaryPassword}`);
      }
      loadUsers();
    } catch {
      alert('Erreur');
    }
  };

  const roleFilters = [
    { label: 'Tous', value: '' },
    { label: 'Coordinateurs', value: 'COORDINATEUR' },
    { label: 'Superviseurs', value: 'SUPERVISEUR' },
    { label: 'Commerciaux', value: 'COMMERCIAL' },
  ];


  return (
    <div>
      {/* Stats bar */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-5 text-[13px]">
          <span><b className="font-head text-lg">{total}</b> <span className="text-k2l-gray-400">utilisateur(s)</span></span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="rounded-lg bg-k2l-success px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-k2l-success/90 transition-colors"
          >
            + Nouvel utilisateur
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {roleFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => { setRoleFilter(f.value); setPage(1); }}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors ${
              roleFilter === f.value
                ? 'bg-[#1D9E75] text-white border-[#1D9E75]'
                : 'bg-white text-k2l-gray-600 border-k2l-gray-200 hover:border-[#1D9E75]'
            }`}
          >
            {f.label}
          </button>
        ))}

        {/* Zone filter */}
        <select
          value={zoneFilter}
          onChange={(e) => { setZoneFilter(e.target.value); setPage(1); }}
          className={`rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors outline-none ${
            zoneFilter
              ? 'bg-[#1F5C99] text-white border-[#1F5C99]'
              : 'bg-white text-k2l-gray-600 border-k2l-gray-200'
          }`}
        >
          <option value="">Toutes les zones</option>
          {zones.map((z) => (
            <option key={z.id} value={z.id}>{z.name}</option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-2 rounded-lg border border-k2l-gray-200 bg-white px-3 py-2">
          <RiSearchLine className="text-sm text-k2l-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-44 bg-transparent text-xs outline-none placeholder:text-k2l-gray-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-k2l-gray-200 bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RiLoader4Line className="animate-spin text-2xl text-[#1D9E75]" />
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-k2l-gray-200">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-k2l-gray-400">Utilisateur</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-k2l-gray-400">Role</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-k2l-gray-400">Rattachement</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-k2l-gray-400">Statut</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-k2l-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-k2l-gray-100 last:border-b-0 hover:bg-k2l-gray-100/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E1F5EE] text-[11px] font-bold text-[#0F6E56] font-head">
                        {u.fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{u.fullName}</div>
                        <div className="text-[11px] text-k2l-gray-400">{u.matricule}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${ROLE_BADGE[u.role] || ''}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-k2l-gray-600 text-[12px]">
                    {u.role === 'COORDINATEUR' && (u.zone?.name ? `Zone: ${u.zone.name}` : 'Aucune zone')}
                    {u.role === 'SUPERVISEUR' && (
                      u.secteur?.name 
                        ? <span>
                            {u.zone?.coordinator?.fullName && <span className="text-k2l-primary font-medium">Coord: {u.zone.coordinator.fullName}</span>}
                            {u.zone?.coordinator?.fullName && u.secteur?.name && <span className="text-k2l-gray-300"> · </span>}
                            <span>{u.secteur.name}</span>
                          </span>
                        : 'Aucun secteur'
                    )}
                    {u.role === 'COMMERCIAL' && (
                      u.supervisor?.fullName 
                        ? <span>
                            {u.zone?.coordinator?.fullName && <span className="text-k2l-primary font-medium">Coord: {u.zone.coordinator.fullName}</span>}
                            {u.zone?.coordinator?.fullName && <span className="text-k2l-gray-300"> · </span>}
                            <span>Sup: {u.supervisor.fullName}</span>
                          </span>
                        : (u.secteur?.name ? `Secteur: ${u.secteur.name}` : 'Non assigné')
                    )}
                    {u.role === 'ADMIN' && <span className="text-k2l-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_BADGE[u.status] || ''}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    {u.role !== 'ADMIN' && (
                      <button
                        onClick={() => setEditUser(u)}
                        className="rounded border border-[#1F5C99] px-2 py-1 text-[11px] text-[#1F5C99] hover:bg-[#1F5C99]/10"
                      >
                        Modifier
                      </button>
                    )}
                    <select
                      onChange={(e) => { if (e.target.value) { handleAction(u.id, e.target.value); e.target.value = ''; } }}
                      className="rounded border border-k2l-gray-200 bg-transparent px-2 py-1 text-[11px] outline-none"
                      defaultValue=""
                    >
                      <option value="" disabled>Actions</option>
                      {u.isActive && <option value="deactivate">Désactiver</option>}
                      {!u.isActive && <option value="activate">Activer</option>}
                      {u.isActive && <option value="suspend">Suspendre</option>}
                      <option value="reset">Reset MdP</option>
                    </select>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-k2l-gray-400">Aucun utilisateur</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-k2l-gray-400">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded px-2 py-1 hover:bg-k2l-gray-200 disabled:opacity-40">Prec.</button>
          <span>Page {page} / {Math.ceil(total / 20)}</span>
          <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(page + 1)} className="rounded px-2 py-1 hover:bg-k2l-gray-200 disabled:opacity-40">Suiv.</button>
        </div>
      )}

      {/* Create modal */}
      {showCreate && <CreateUserModal onClose={() => { setShowCreate(false); loadUsers(); }} />}

      {/* Edit modal */}
      {editUser && <EditUserModal user={editUser} onClose={() => { setEditUser(null); loadUsers(); }} />}
    </div>
  );
}

interface Supervisor { id: string; fullName: string; matricule: string; }

function CreateUserModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', password: '', confirmPassword: '', role: 'COMMERCIAL', supervisorId: '' });
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [saving, setSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Charge uniquement les superviseurs qui ont un secteur assigné
    api.get('/users?role=SUPERVISEUR&limit=100').then((res) => {
      const sups = (res.data.data || []).filter((s: { secteurId?: string }) => s.secteurId);
      setSupervisors(sups);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation de l'email si fourni
    if (form.email && form.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        setPasswordError('Format d\'email invalide');
        return;
      }
    }
    
    // Validation des mots de passe
    if (form.password !== form.confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (form.password.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    
    setPasswordError('');
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        fullName: form.fullName,
        phone: form.phone,
        password: form.password,
        role: form.role,
        supervisorId: form.role === 'COMMERCIAL' && form.supervisorId ? form.supervisorId : undefined,
      };
      // N'envoyer l'email que s'il est valide et non vide
      if (form.email && form.email.trim()) {
        payload.email = form.email.trim();
      }
      await api.post('/users', payload);
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur';
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form onSubmit={handleSubmit} autoComplete="off" className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 font-head text-lg font-semibold">Nouvel utilisateur</h2>
        <div className="space-y-3 text-[13px]">
          <input required name="user-fullname" autoComplete="off" placeholder="Nom complet" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="w-full rounded-lg border border-k2l-gray-200 px-3 py-2.5 outline-none focus:border-k2l-primary" />
          <input required type="tel" name="user-phone" autoComplete="off" placeholder="Téléphone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border border-k2l-gray-200 px-3 py-2.5 outline-none focus:border-k2l-primary" />
          <input type="email" name="user-email" autoComplete="off" placeholder="Email (optionnel - ex: nom@email.com)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-k2l-gray-200 px-3 py-2.5 outline-none focus:border-k2l-primary" />
          <div className="relative">
            <input required type={showPassword ? 'text' : 'password'} name="user-password" autoComplete="new-password" placeholder="Mot de passe (min. 8 caractères)" value={form.password} onChange={(e) => { setForm({ ...form, password: e.target.value }); setPasswordError(''); }} className="w-full rounded-lg border border-k2l-gray-200 px-3 py-2.5 outline-none focus:border-k2l-primary pr-10" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-k2l-gray-400 hover:text-k2l-gray-600">
              {showPassword ? <RiEyeOffLine /> : <RiEyeLine />}
            </button>
          </div>
          <div className="relative">
            <input required type={showConfirmPassword ? 'text' : 'password'} name="user-password-confirm" autoComplete="new-password" placeholder="Confirmer le mot de passe" value={form.confirmPassword} onChange={(e) => { setForm({ ...form, confirmPassword: e.target.value }); setPasswordError(''); }} className="w-full rounded-lg border border-k2l-gray-200 px-3 py-2.5 outline-none focus:border-k2l-primary pr-10" />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-k2l-gray-400 hover:text-k2l-gray-600">
              {showConfirmPassword ? <RiEyeOffLine /> : <RiEyeLine />}
            </button>
          </div>
          {passwordError && <p className="text-xs text-k2l-red font-semibold">{passwordError}</p>}
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value, supervisorId: '' })} className="w-full rounded-lg border border-k2l-gray-200 px-3 py-2.5 outline-none">
            <option value="COMMERCIAL">Commercial</option>
            <option value="SUPERVISEUR">Superviseur</option>
            <option value="COORDINATEUR">Coordinateur</option>
          </select>
          {form.role === 'COMMERCIAL' && (
            <>
              <select required value={form.supervisorId} onChange={(e) => setForm({ ...form, supervisorId: e.target.value })} className="w-full rounded-lg border border-k2l-gray-200 px-3 py-2.5 outline-none">
                <option value="">-- Choisir un superviseur (obligatoire) --</option>
                {supervisors.map((s) => <option key={s.id} value={s.id}>{s.fullName} ({s.matricule})</option>)}
              </select>
              <p className="text-[11px] text-k2l-gray-400 -mt-1">Le secteur et la zone seront hérités automatiquement du superviseur</p>
            </>
          )}
        </div>
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-k2l-gray-200 py-2.5 text-[13px] font-semibold text-k2l-gray-600 hover:bg-k2l-gray-100">Annuler</button>
          <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-[#1D9E75] py-2.5 text-[13px] font-semibold text-white hover:bg-[#0F6E56] disabled:opacity-50">
            {saving ? 'Création...' : 'Créer'}
          </button>
        </div>
      </form>
    </div>
  );
}

interface EditUserModalProps {
  user: User;
  onClose: () => void;
}

function EditUserModal({ user, onClose }: EditUserModalProps) {
  const [form, setForm] = useState({
    fullName: user.fullName,
    phone: user.phone,
    supervisorId: user.supervisor?.id || '',
  });
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Charge les superviseurs qui ont un secteur assigné
    api.get('/users?role=SUPERVISEUR&limit=100').then((res) => {
      const sups = (res.data.data || []).filter((s: { secteurId?: string }) => s.secteurId);
      setSupervisors(sups);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, string | undefined> = {
        fullName: form.fullName,
        phone: form.phone,
      };
      
      // Pour un commercial, on peut changer le superviseur
      if (user.role === 'COMMERCIAL') {
        payload.supervisorId = form.supervisorId || undefined;
      }

      await api.patch(`/users/${user.id}`, payload);
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur';
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 font-head text-lg font-semibold">Modifier {user.fullName}</h2>
        <div className="mb-3 flex items-center gap-2">
          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold bg-[#E6F1FB] text-[#1F5C99]`}>
            {user.role}
          </span>
          <span className="text-[11px] text-k2l-gray-400">{user.matricule}</span>
        </div>
        <div className="space-y-3 text-[13px]">
          <div>
            <label className="text-[11px] text-k2l-gray-400">Nom complet</label>
            <input 
              required 
              value={form.fullName} 
              onChange={(e) => setForm({ ...form, fullName: e.target.value })} 
              className="mt-1 w-full rounded-lg border border-k2l-gray-200 px-3 py-2.5 outline-none focus:border-[#1D9E75]" 
            />
          </div>
          <div>
            <label className="text-[11px] text-k2l-gray-400">Téléphone</label>
            <input 
              required 
              value={form.phone} 
              onChange={(e) => setForm({ ...form, phone: e.target.value })} 
              className="mt-1 w-full rounded-lg border border-k2l-gray-200 px-3 py-2.5 outline-none focus:border-[#1D9E75]" 
            />
          </div>
          
          {user.role === 'COMMERCIAL' && (
            <div>
              <label className="text-[11px] text-k2l-gray-400">Superviseur</label>
              <select 
                required 
                value={form.supervisorId} 
                onChange={(e) => setForm({ ...form, supervisorId: e.target.value })} 
                className="mt-1 w-full rounded-lg border border-k2l-gray-200 px-3 py-2.5 outline-none"
              >
                <option value="">-- Choisir un superviseur --</option>
                {supervisors.map((s) => (
                  <option key={s.id} value={s.id}>{s.fullName} ({s.matricule})</option>
                ))}
              </select>
              <p className="text-[11px] text-k2l-gray-400 mt-1">Le secteur et la zone seront mis à jour automatiquement</p>
            </div>
          )}

          {user.role === 'SUPERVISEUR' && (
            <div className="rounded-lg bg-k2l-gray-100 p-3 text-[12px]">
              <p className="text-k2l-gray-600">
                <strong>Secteur actuel :</strong> {user.secteur?.name || 'Aucun'}
              </p>
              <p className="text-k2l-gray-400 mt-1">
                Pour changer le secteur, allez dans la page Secteurs.
              </p>
            </div>
          )}

          {user.role === 'COORDINATEUR' && (
            <div className="rounded-lg bg-k2l-gray-100 p-3 text-[12px]">
              <p className="text-k2l-gray-600">
                <strong>Zone actuelle :</strong> {user.zone?.name || 'Aucune'}
              </p>
              <p className="text-k2l-gray-400 mt-1">
                Pour changer la zone, allez dans la page Zones.
              </p>
            </div>
          )}
        </div>
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-k2l-gray-200 py-2.5 text-[13px] font-semibold text-k2l-gray-600 hover:bg-k2l-gray-100">
            Annuler
          </button>
          <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-[#1F5C99] py-2.5 text-[13px] font-semibold text-white hover:bg-[#1F5C99]/90 disabled:opacity-50">
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}
