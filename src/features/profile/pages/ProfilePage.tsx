import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiUserLine, RiLogoutBoxRLine, RiMailLine, RiPhoneLine,
  RiShieldUserLine, RiMapPin2Line, RiCalendarLine, RiFileList3Line,
  RiLockPasswordLine, RiEyeLine, RiEyeOffLine, RiCloseLine, RiEditLine,
  RiUserStarLine,
} from 'react-icons/ri';
import { useAuthStore } from '@/common/stores/auth.store';
import { useOnlineStatus } from '@/common/hooks/useOnlineStatus';
import api from '@/common/services/api';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrateur',
  COORDINATEUR: 'Coordinateur',
  SUPERVISEUR: 'Superviseur',
  COMMERCIAL: 'Commercial',
  CLIENT: 'Client',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIF: 'Actif',
  SUSPENDU: 'Suspendu',
  EN_ATTENTE: 'En attente',
  DESACTIVE: 'Desactive',
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const isOnline = useOnlineStatus();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // États pour l'édition du profil
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');

  const initials = user?.fullName
    ?.split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? 'AG';

  const handleLogout = () => {
    if (!confirm('Voulez-vous vraiment vous deconnecter ?')) return;
    logout();
    navigate('/login', { replace: true });
  };

  const handleOpenEditModal = () => {
    setEditFullName(user?.fullName || '');
    setEditPhone(user?.phone || '');
    setEditEmail(user?.email || '');
    setShowEditModal(true);
    setError('');
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!editFullName.trim()) {
      setError('Le nom complet est requis');
      return;
    }

    if (!editPhone.trim()) {
      setError('Le numéro de téléphone est requis');
      return;
    }

    setSaving(true);
    try {
      const response = await api.patch(`/users/${user?.id}/profile`, {
        fullName: editFullName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim() || undefined,
      });
      
      // Mettre à jour l'utilisateur dans le store
      setUser(response.data);
      alert('Informations mises à jour avec succès');
      setShowEditModal(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur lors de la mise à jour';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setSaving(true);
    try {
      await api.patch(`/users/${user?.id}/change-password`, {
        password: newPassword,
      });
      alert('Mot de passe modifié avec succès');
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const infoRows: { icon: React.ReactNode; label: string; value: string }[] = [
    { icon: <RiShieldUserLine />, label: 'Role', value: ROLE_LABELS[user?.role ?? ''] ?? user?.role ?? '—' },
    { icon: <RiUserLine />, label: 'Matricule', value: user?.matricule ?? '—' },
    { icon: <RiPhoneLine />, label: 'Telephone', value: user?.phone ?? '—' },
    { icon: <RiMailLine />, label: 'Email', value: user?.email ?? 'Non renseigne' },
    { icon: <RiMapPin2Line />, label: 'Cluster', value: user?.cluster?.name ?? 'Non assignee' },
    { icon: <RiUserStarLine />, label: 'Code parrain', value: user?.sponsorCode ?? '—' },
    {
      icon: <RiCalendarLine />,
      label: 'Inscrit le',
      value: user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
        : '—',
    },
  ];

  return (
    <div className="min-h-full bg-k2l-gray-100">
      {/* Header */}
      <div className="bg-k2l-navy px-5 pb-8 pt-6">
        <div className="flex flex-col items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-white/30 bg-white/20 font-head text-2xl font-bold text-white">
            {initials}
          </div>
          <h1 className="mt-3 font-head text-lg font-bold text-white">{user?.fullName ?? 'Agent'}</h1>
          <div className="mt-1 flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
              user?.status === 'ACTIF' ? 'bg-k2l-success-light text-k2l-success' : 'bg-k2l-amber-light text-[#854F0B]'
            }`}>
              {STATUS_LABELS[user?.status ?? ''] ?? user?.status}
            </span>
            <span className="text-xs text-white/60">{ROLE_LABELS[user?.role ?? ''] ?? user?.role}</span>
          </div>
        </div>
      </div>

      {/* Info card */}
      <div className="-mt-4 mx-4 rounded-lg bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
        <div className="mb-3 font-head text-[13px] font-semibold uppercase tracking-wider text-k2l-gray-600">
          Informations
        </div>
        <div className="divide-y divide-k2l-gray-100">
          {infoRows.map((row) => (
            <div key={row.label} className="flex items-center gap-3 py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-k2l-primary-light text-k2l-primary">
                {row.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-k2l-gray-400">{row.label}</div>
                <div className="truncate text-[13px] font-medium text-k2l-gray-900">{row.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Connection status */}
      <div className="mx-4 mt-3 rounded-lg bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-k2l-gray-600">Statut connexion</span>
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
            isOnline ? 'bg-k2l-success-light text-k2l-success' : 'bg-k2l-amber-light text-[#854F0B]'
          }`}>
            {isOnline ? 'En ligne' : 'Hors-ligne'}
          </span>
        </div>
      </div>

      {/* Historique button */}
      <div className="mx-4 mt-4">
        <button
          onClick={() => navigate('/mes-soumissions')}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-k2l-navy py-3.5 font-head text-sm font-semibold text-white transition-all active:scale-[0.98]"
        >
          <RiFileList3Line className="text-lg" />
          Historique des soumissions
        </button>
      </div>

      {/* Change password button */}
      <div className="mx-4 mt-3">
        <button
          onClick={() => setShowPasswordModal(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-k2l-primary bg-white py-3.5 font-head text-sm font-semibold text-k2l-primary transition-all active:scale-[0.98] active:bg-k2l-primary-light"
        >
          <RiLockPasswordLine className="text-lg" />
          Changer le mot de passe
        </button>
      </div>

      {/* Edit profile button */}
      <div className="mx-4 mt-3">
        <button
          onClick={handleOpenEditModal}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-k2l-gray-300 bg-white py-3.5 font-head text-sm font-semibold text-k2l-gray-700 transition-all active:scale-[0.98] active:bg-k2l-gray-100"
        >
          <RiEditLine className="text-lg" />
          Modifier mes informations
        </button>
      </div>

      {/* Logout button */}
      <div className="mx-4 mt-4 pb-6">
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-k2l-red bg-white py-3.5 font-head text-sm font-semibold text-k2l-red transition-all active:scale-[0.98] active:bg-k2l-red-light"
        >
          <RiLogoutBoxRLine className="text-lg" />
          Se deconnecter
        </button>
      </div>

      {/* Password change modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-head text-sm font-semibold">Changer le mot de passe</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-k2l-gray-400">
                <RiCloseLine className="text-xl" />
              </button>
            </div>
            <form onSubmit={handlePasswordChange} className="space-y-3">
              <div>
                <label className="text-[11px] text-k2l-gray-400">Nouveau mot de passe</label>
                <div className="relative mt-1">
                  <input
                    required
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-lg border border-k2l-gray-200 px-3 py-2.5 text-sm outline-none focus:border-k2l-primary pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-k2l-gray-400"
                  >
                    {showNewPassword ? <RiEyeOffLine className="text-lg" /> : <RiEyeLine className="text-lg" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[11px] text-k2l-gray-400">Confirmer le mot de passe</label>
                <div className="relative mt-1">
                  <input
                    required
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg border border-k2l-gray-200 px-3 py-2.5 text-sm outline-none focus:border-k2l-primary pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-k2l-gray-400"
                  >
                    {showConfirmPassword ? <RiEyeOffLine className="text-lg" /> : <RiEyeLine className="text-lg" />}
                  </button>
                </div>
              </div>
              {error && <p className="text-xs text-k2l-red">{error}</p>}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 rounded-lg border border-k2l-gray-200 py-2.5 text-sm font-medium text-k2l-gray-600"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-lg bg-k2l-primary py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {saving ? 'Modification...' : 'Modifier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit profile modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-head text-sm font-semibold">Modifier mes informations</h3>
              <button onClick={() => setShowEditModal(false)} className="text-k2l-gray-400">
                <RiCloseLine className="text-xl" />
              </button>
            </div>
            <form onSubmit={handleProfileUpdate} className="space-y-3">
              <div>
                <label className="text-[11px] text-k2l-gray-400">Nom complet</label>
                <input
                  required
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-k2l-gray-200 px-3 py-2.5 text-sm outline-none focus:border-k2l-primary"
                  placeholder="Votre nom complet"
                />
              </div>
              <div>
                <label className="text-[11px] text-k2l-gray-400">Téléphone</label>
                <input
                  required
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-k2l-gray-200 px-3 py-2.5 text-sm outline-none focus:border-k2l-primary"
                  placeholder="Votre numéro de téléphone"
                />
              </div>
              <div>
                <label className="text-[11px] text-k2l-gray-400">Email (optionnel)</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-k2l-gray-200 px-3 py-2.5 text-sm outline-none focus:border-k2l-primary"
                  placeholder="votre@email.com"
                />
              </div>
              {error && <p className="text-xs text-k2l-red">{error}</p>}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 rounded-lg border border-k2l-gray-200 py-2.5 text-sm font-medium text-k2l-gray-600"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-lg bg-k2l-primary py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
