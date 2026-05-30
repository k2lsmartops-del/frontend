import { useState, useEffect, useMemo } from 'react';
import { RiSearchLine, RiLoader4Line, RiEyeLine, RiEyeOffLine, RiFileExcel2Line, RiUserLine, RiTeamLine, RiShieldUserLine, RiBriefcaseLine, RiPencilLine, RiLockPasswordLine, RiCheckLine, RiCloseLine, RiPauseLine, RiMapPinLine } from 'react-icons/ri';
import api from '@/common/services/api';
import ImportTeamModal from '../components/ImportTeamModal';

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

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [zoneFilter, setZoneFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);

  // Charger les zones au montage
  useEffect(() => {
    api.get('/zones').then((res) => setZones(res.data || [])).catch(() => {});
  }, []);

  // Charger les utilisateurs
  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: '100' });
        if (search) params.set('search', search);
        if (roleFilter) params.set('role', roleFilter);
        if (zoneFilter) params.set('zoneId', zoneFilter);
        if (statusFilter) params.set('status', statusFilter);
        const res = await api.get(`/users?${params}`);
        setUsers(res.data.data || []);
        setTotal(res.data.meta?.total || 0);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, [page, search, roleFilter, zoneFilter, statusFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '100' });
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      if (zoneFilter) params.set('zoneId', zoneFilter);
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/users?${params}`);
      setUsers(res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId: string, action: string) => {
    try {
      if (action === 'activate') await api.patch(`/users/${userId}/activate`);
      else if (action === 'deactivate') await api.patch(`/users/${userId}/deactivate`);
      else if (action === 'suspend') await api.patch(`/users/${userId}/suspend`);
      else if (action === 'reset') {
        const user = users.find((u) => u.id === userId);
        if (user) setResetPasswordUser(user);
        return;
      }
      loadUsers();
    } catch {
      alert('Erreur');
    }
  };

  // KPIs calculés
  const kpis = useMemo(() => {
    const totalUsers = users.length;
    const activeCoordinators = users.filter((u) => u.role === 'COORDINATEUR' && u.isActive).length;
    const activeSupervisors = users.filter((u) => u.role === 'SUPERVISEUR' && u.isActive).length;
    const activeCommercials = users.filter((u) => u.role === 'COMMERCIAL' && u.isActive).length;
    
    return { totalUsers, activeCoordinators, activeSupervisors, activeCommercials };
  }, [users]);

  // Filtres par rôle
  const roleFilters = [
    { label: 'Tous', value: '', count: users.length },
    { label: 'Coordinateurs', value: 'COORDINATEUR', count: users.filter((u) => u.role === 'COORDINATEUR').length },
    { label: 'Superviseurs', value: 'SUPERVISEUR', count: users.filter((u) => u.role === 'SUPERVISEUR').length },
    { label: 'Commerciaux', value: 'COMMERCIAL', count: users.filter((u) => u.role === 'COMMERCIAL').length },
  ];

  // Filtres par statut
  const statusFilters = [
    { label: 'Tous statuts', value: '' },
    { label: 'Actifs', value: 'ACTIF' },
    { label: 'Suspendus', value: 'SUSPENDU' },
    { label: 'Désactivés', value: 'DESACTIVE' },
  ];


  return (
    <div>
      {/* Header avec actions */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-head text-2xl font-bold text-k2l-gray-900">Gestion des utilisateurs</h1>
          <p className="mt-1 text-sm text-k2l-gray-400">{total} utilisateur(s) au total</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 rounded-lg border-2 border-[#1D9E75] px-4 py-2.5 text-[13px] font-semibold text-[#1D9E75] hover:bg-[#1D9E75]/5 transition-colors"
          >
            <RiFileExcel2Line className="text-lg" /> Importer Excel
          </button>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 rounded-lg bg-[#1D9E75] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#0F6E56] transition-colors"
          >
            <RiUserLine className="text-lg" /> Nouvel utilisateur
          </button>
        </div>
      </div>

      {/* Bandeau KPI */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <KpiCard
          label="Total utilisateurs"
          value={kpis.totalUsers}
          icon={<RiTeamLine />}
          color="blue"
        />
        <KpiCard
          label="Coordinateurs actifs"
          value={kpis.activeCoordinators}
          icon={<RiShieldUserLine />}
          color="blue"
        />
        <KpiCard
          label="Superviseurs actifs"
          value={kpis.activeSupervisors}
          icon={<RiBriefcaseLine />}
          color="blue"
        />
        <KpiCard
          label="Commerciaux actifs"
          value={kpis.activeCommercials}
          icon={<RiUserLine />}
          color="green"
        />
      </div>

      {/* Toolbar filtres */}
      <div className="mb-4 space-y-3">
        {/* Ligne 1: Filtres par rôle */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-k2l-gray-400 uppercase tracking-wider">Rôle :</span>
          {roleFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => { setRoleFilter(f.value); setPage(1); }}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                roleFilter === f.value
                  ? 'bg-[#1D9E75] text-white'
                  : 'bg-white text-k2l-gray-600 border border-k2l-gray-200 hover:border-[#1D9E75]'
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        {/* Ligne 2: Filtres par statut + zone + recherche */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-k2l-gray-400 uppercase tracking-wider">Statut :</span>
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => { setStatusFilter(f.value); setPage(1); }}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === f.value
                  ? 'bg-[#1F5C99] text-white'
                  : 'bg-white text-k2l-gray-600 border border-k2l-gray-200 hover:border-[#1F5C99]'
              }`}
            >
              {f.label}
            </button>
          ))}

          {/* Zone filter */}
          <select
            value={zoneFilter}
            onChange={(e) => { setZoneFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-k2l-gray-200 bg-white px-3 py-1.5 text-xs font-medium outline-none hover:border-[#1D9E75] transition-colors"
          >
            <option value="">📍 Toutes les zones</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>{z.name}</option>
            ))}
          </select>

          {/* Recherche */}
          <div className="ml-auto flex items-center gap-2 rounded-lg border border-k2l-gray-200 bg-white px-3 py-2">
            <RiSearchLine className="text-sm text-k2l-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, matricule, téléphone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-64 bg-transparent text-[13px] outline-none placeholder:text-k2l-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Grille de cartes */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RiLoader4Line className="animate-spin text-3xl text-[#1D9E75]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onEdit={() => setEditUser(user)}
              onResetPassword={() => setResetPasswordUser(user)}
              onAction={handleAction}
            />
          ))}
          {users.length === 0 && (
            <div className="col-span-3 rounded-xl border border-k2l-gray-200 bg-white p-12 text-center">
              <p className="text-k2l-gray-400">Aucun utilisateur trouvé</p>
            </div>
          )}
        </div>
      )}

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

      {/* Reset Password modal */}
      {resetPasswordUser && <ResetPasswordModal user={resetPasswordUser} onClose={() => { setResetPasswordUser(null); loadUsers(); }} />}

      {/* Import Excel modal */}
      {showImport && (
        <ImportTeamModal
          onClose={() => setShowImport(false)}
          onSuccess={loadUsers}
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
  color: 'green' | 'blue';
}

function KpiCard({ label, value, icon, color }: KpiCardProps) {
  const colorClasses = {
    green: 'bg-k2l-success-light text-[#1D9E75]',
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

interface UserCardProps {
  user: User;
  onEdit: () => void;
  onResetPassword: () => void;
  onAction: (userId: string, action: string) => void;
}

function UserCard({ user, onEdit, onResetPassword, onAction }: UserCardProps) {
  // Couleur de l'avatar selon le rôle
  const avatarColors = {
    ADMIN: 'bg-[#FCEBEB] text-[#A32D2D]',
    COORDINATEUR: 'bg-[#E6F1FB] text-[#1F5C99]',
    SUPERVISEUR: 'bg-[#E6F1FB] text-[#1F5C99]',
    COMMERCIAL: 'bg-k2l-success-light text-[#0F6E56]',
  };

  // Couleur de la bordure selon le statut
  const borderColors = {
    ACTIF: 'border-l-[#1D9E75]',
    SUSPENDU: 'border-l-[#EF9F27]',
    EN_ATTENTE: 'border-l-[#EF9F27]',
    DESACTIVE: 'border-l-k2l-gray-300',
  };

  // Badge rôle
  const roleBadges = {
    ADMIN: 'bg-[#FCEBEB] text-[#A32D2D]',
    COORDINATEUR: 'bg-[#E6F1FB] text-[#1F5C99]',
    SUPERVISEUR: 'bg-[#E6F1FB] text-[#1F5C99]',
    COMMERCIAL: 'bg-k2l-gray-100 text-k2l-gray-600',
  };

  // Badge statut
  const statusBadges = {
    ACTIF: 'bg-k2l-success-light text-[#0F6E56]',
    SUSPENDU: 'bg-k2l-amber-light text-[#854F0B]',
    EN_ATTENTE: 'bg-k2l-amber-light text-[#854F0B]',
    DESACTIVE: 'bg-k2l-gray-100 text-k2l-gray-600',
  };

  const initials = user.fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '??';

  return (
    <div
      className={`group relative rounded-xl border-l-[5px] ${borderColors[user.status as keyof typeof borderColors]} border-y border-r border-k2l-gray-200 bg-white p-5 transition-all hover:-translate-y-1 hover:shadow-lg`}
    >
      {/* Header: Avatar + Nom + Badges */}
      <div className="mb-4 flex items-start gap-3">
        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${avatarColors[user.role as keyof typeof avatarColors]} text-sm font-bold font-head`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-head text-base font-bold text-k2l-gray-900 truncate">{user.fullName}</h3>
          <p className="text-[11px] text-k2l-gray-400">{user.matricule}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${roleBadges[user.role as keyof typeof roleBadges]}`}>
              {user.role}
            </span>
            <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadges[user.status as keyof typeof statusBadges]}`}>
              {user.status}
            </span>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="mb-3 space-y-1 text-[12px]">
        <div className="flex items-center gap-2 text-k2l-gray-600">
          <span className="font-medium">📱</span>
          <span>{user.phone}</span>
        </div>
      </div>

      {/* Hiérarchie / Rattachement */}
      <div className="mb-3 rounded-lg bg-k2l-gray-100 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-k2l-gray-400 mb-1.5">Rattachement</p>
        {user.role === 'COORDINATEUR' && (
          <div className="text-[12px] text-k2l-gray-600">
            {user.zone?.name ? (
              <div className="flex items-center gap-1.5">
                <RiMapPinLine className="text-[#1F5C99]" />
                <span className="font-medium">{user.zone.name}</span>
              </div>
            ) : (
              <span className="text-k2l-gray-400 italic">Aucune zone assignée</span>
            )}
          </div>
        )}
        {user.role === 'SUPERVISEUR' && (
          <div className="text-[12px] space-y-1">
            {user.zone?.coordinator?.fullName && (
              <div className="flex items-center gap-1.5 text-[#1F5C99]">
                <RiShieldUserLine />
                <span className="font-medium">Coord: {user.zone.coordinator.fullName}</span>
              </div>
            )}
            {user.secteur?.name ? (
              <div className="flex items-center gap-1.5 text-k2l-gray-600">
                <RiMapPinLine />
                <span>{user.secteur.name}</span>
              </div>
            ) : (
              <span className="text-k2l-gray-400 italic">Aucun secteur assigné</span>
            )}
          </div>
        )}
        {user.role === 'COMMERCIAL' && (
          <div className="text-[12px] space-y-1">
            {user.zone?.coordinator?.fullName && (
              <div className="flex items-center gap-1.5 text-[#1F5C99]">
                <RiShieldUserLine />
                <span className="font-medium">Coord: {user.zone.coordinator.fullName}</span>
              </div>
            )}
            {user.supervisor?.fullName ? (
              <div className="flex items-center gap-1.5 text-k2l-gray-600">
                <RiBriefcaseLine />
                <span>Sup: {user.supervisor.fullName}</span>
              </div>
            ) : user.secteur?.name ? (
              <div className="flex items-center gap-1.5 text-k2l-gray-600">
                <RiMapPinLine />
                <span>Secteur: {user.secteur.name}</span>
              </div>
            ) : (
              <span className="text-k2l-gray-400 italic">Non assigné</span>
            )}
          </div>
        )}
        {user.role === 'ADMIN' && (
          <span className="text-[12px] text-k2l-gray-400 italic">Administrateur système</span>
        )}
      </div>

      {/* Actions (hover) */}
      <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        {user.role !== 'ADMIN' && (
          <button
            onClick={onEdit}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#1F5C99] px-3 py-2 text-[11px] font-semibold text-white hover:bg-[#1F5C99]/90 transition-colors"
          >
            <RiPencilLine /> Modifier
          </button>
        )}
        <button
          onClick={onResetPassword}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#EF9F27] px-3 py-2 text-[11px] font-semibold text-white hover:bg-[#EF9F27]/90 transition-colors"
        >
          <RiLockPasswordLine /> Reset MdP
        </button>
      </div>

      {/* Actions rapides (statut) */}
      <div className="mt-2 flex gap-1">
        {user.isActive && (
          <>
            <button
              onClick={() => onAction(user.id, 'suspend')}
              className="flex flex-1 items-center justify-center gap-1 rounded border border-k2l-amber px-2 py-1.5 text-[10px] font-semibold text-k2l-amber hover:bg-k2l-amber-light transition-colors"
              title="Suspendre"
            >
              <RiPauseLine /> Suspendre
            </button>
            <button
              onClick={() => onAction(user.id, 'deactivate')}
              className="flex flex-1 items-center justify-center gap-1 rounded border border-k2l-gray-400 px-2 py-1.5 text-[10px] font-semibold text-k2l-gray-600 hover:bg-k2l-gray-100 transition-colors"
              title="Désactiver"
            >
              <RiCloseLine /> Désactiver
            </button>
          </>
        )}
        {!user.isActive && (
          <button
            onClick={() => onAction(user.id, 'activate')}
            className="flex flex-1 items-center justify-center gap-1 rounded border border-[#1D9E75] px-2 py-1.5 text-[10px] font-semibold text-[#1D9E75] hover:bg-k2l-success-light transition-colors"
            title="Activer"
          >
            <RiCheckLine /> Activer
          </button>
        )}
      </div>
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

interface ResetPasswordModalProps {
  user: User;
  onClose: () => void;
}

function ResetPasswordModal({ user, onClose }: ResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    
    setError('');
    setSaving(true);
    try {
      await api.patch(`/users/${user.id}`, { password: newPassword });
      alert('Mot de passe modifié avec succès');
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 font-head text-lg font-semibold">Réinitialiser le mot de passe</h2>
        <div className="mb-4 rounded-lg bg-k2l-gray-100 p-3">
          <p className="text-[13px] text-k2l-gray-600">
            <strong>{user.fullName}</strong>
          </p>
          <p className="text-[11px] text-k2l-gray-400">{user.matricule} · {user.phone}</p>
        </div>
        <div className="space-y-3 text-[13px]">
          <div className="relative">
            <label className="mb-1 block text-[11px] text-k2l-gray-400">Nouveau mot de passe</label>
            <input 
              required 
              type={showPassword ? 'text' : 'password'} 
              placeholder="Min. 8 caractères" 
              value={newPassword} 
              onChange={(e) => { setNewPassword(e.target.value); setError(''); }} 
              className="w-full rounded-lg border border-k2l-gray-200 px-3 py-2.5 outline-none focus:border-k2l-primary pr-10" 
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[34px] -translate-y-1/2 text-k2l-gray-400 hover:text-k2l-gray-600"
            >
              {showPassword ? <RiEyeOffLine /> : <RiEyeLine />}
            </button>
          </div>
          <div className="relative">
            <label className="mb-1 block text-[11px] text-k2l-gray-400">Confirmer le mot de passe</label>
            <input 
              required 
              type={showConfirmPassword ? 'text' : 'password'} 
              placeholder="Confirmer" 
              value={confirmPassword} 
              onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }} 
              className="w-full rounded-lg border border-k2l-gray-200 px-3 py-2.5 outline-none focus:border-k2l-primary pr-10" 
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-[34px] -translate-y-1/2 text-k2l-gray-400 hover:text-k2l-gray-600"
            >
              {showConfirmPassword ? <RiEyeOffLine /> : <RiEyeLine />}
            </button>
          </div>
          {error && <p className="text-xs text-k2l-red font-semibold">{error}</p>}
        </div>
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-k2l-gray-200 py-2.5 text-[13px] font-semibold text-k2l-gray-600 hover:bg-k2l-gray-100">
            Annuler
          </button>
          <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-k2l-red py-2.5 text-[13px] font-semibold text-white hover:bg-k2l-red/90 disabled:opacity-50">
            {saving ? 'Modification...' : 'Modifier le mot de passe'}
          </button>
        </div>
      </form>
    </div>
  );
}
