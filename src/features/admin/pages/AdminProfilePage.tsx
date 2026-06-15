import { useState } from 'react';
import {
  RiUserLine, RiLogoutBoxRLine, RiMailLine, RiPhoneLine,
  RiShieldUserLine, RiMapPin2Line, RiCalendarLine, RiLockPasswordLine,
  RiEyeLine, RiEyeOffLine, RiEditLine, RiCloseLine, RiShieldCheckLine,
} from 'react-icons/ri';
import { useAuthStore } from '@/common/stores/auth.store';
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

export default function AdminProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
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
  const [editGender, setEditGender] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');

  // États pour le 2FA
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFactorAction, setTwoFactorAction] = useState<'enable' | 'disable'>('enable');
  const [qrCode, setQrCode] = useState('');
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const initials = user?.fullName
    ?.split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? 'AG';

  const handleLogout = () => {
    if (!confirm('Voulez-vous vraiment vous deconnecter ?')) return;
    logout();
    window.location.href = '/login';
  };

  const handleOpenEditModal = () => {
    setEditFullName(user?.fullName || '');
    setEditGender(user?.gender || '');
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
        gender: editGender || undefined,
        phone: editPhone.trim(),
        email: editEmail.trim() || undefined,
      });
      
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

  const handleEnable2FA = async () => {
    setError('');
    setSaving(true);
    try {
      const response = await api.post(`/users/${user?.id}/two-factor/enable`);
      setQrCode(response.data.qrCode);
      setTwoFactorAction('enable');
      setShow2FAModal(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur';
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post(`/users/${user?.id}/two-factor/verify`, {
        token: twoFactorToken,
      });
      alert('Authentification à double facteur activée avec succès');
      setTwoFactorEnabled(true);
      setShow2FAModal(false);
      setTwoFactorToken('');
      setQrCode('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Code invalide';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post(`/users/${user?.id}/two-factor/disable`, {
        token: twoFactorToken,
      });
      alert('Authentification à double facteur désactivée avec succès');
      setTwoFactorEnabled(false);
      setShow2FAModal(false);
      setTwoFactorToken('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Code invalide';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleOpen2FAModal = (action: 'enable' | 'disable') => {
    setTwoFactorAction(action);
    setError('');
    setTwoFactorToken('');
    if (action === 'enable') {
      handleEnable2FA();
    } else {
      setShow2FAModal(true);
    }
  };

  const infoRows: { icon: React.ReactNode; label: string; value: string }[] = [
    { icon: <RiShieldUserLine />, label: 'Role', value: ROLE_LABELS[user?.role ?? ''] ?? user?.role ?? '—' },
    { icon: <RiUserLine />, label: 'Matricule', value: user?.matricule ?? '—' },
    { icon: <RiUserLine />, label: 'Genre', value: user?.gender === 'M' ? 'Masculin' : user?.gender === 'F' ? 'Féminin' : 'Non renseigné' },
    { icon: <RiPhoneLine />, label: 'Telephone', value: user?.phone ?? '—' },
    { icon: <RiMailLine />, label: 'Email', value: user?.email ?? 'Non renseigne' },
    { icon: <RiMapPin2Line />, label: 'Cluster', value: user?.cluster?.name ?? 'Non assignee' },
    {
      icon: <RiCalendarLine />,
      label: 'Inscrit le',
      value: user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
        : '—',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-head text-2xl font-bold text-k2l-gray-900">Mon Profil</h1>
          <p className="text-sm text-k2l-gray-600">Gérez vos informations personnelles</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg border-2 border-k2l-red bg-white px-4 py-2 text-sm font-semibold text-k2l-red hover:bg-k2l-red-light transition-colors"
        >
          <RiLogoutBoxRLine className="text-lg" />
          Se deconnecter
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile card */}
        <div className="lg:col-span-1">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-[3px] border-k2l-primary/20 bg-k2l-primary/10 font-head text-3xl font-bold text-k2l-primary">
                {initials}
              </div>
              <h2 className="mt-4 font-head text-xl font-bold text-k2l-gray-900">{user?.fullName ?? 'Agent'}</h2>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-full bg-k2l-success-light px-3 py-1 text-xs font-semibold text-k2l-success">
                  {STATUS_LABELS[user?.status ?? ''] ?? user?.status}
                </span>
                <span className="text-sm text-k2l-gray-600">{ROLE_LABELS[user?.role ?? ''] ?? user?.role}</span>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <button
                onClick={handleOpenEditModal}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-k2l-primary py-3 font-head text-sm font-semibold text-white hover:bg-k2l-primary-dark transition-colors"
              >
                <RiEditLine className="text-lg" />
                Modifier mes informations
              </button>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-k2l-primary bg-white py-3 font-head text-sm font-semibold text-k2l-primary hover:bg-k2l-primary-light transition-colors"
              >
                <RiLockPasswordLine className="text-lg" />
                Changer le mot de passe
              </button>
              {twoFactorEnabled ? (
                <button
                  onClick={() => handleOpen2FAModal('disable')}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-k2l-red bg-white py-3 font-head text-sm font-semibold text-k2l-red hover:bg-k2l-red-light transition-colors"
                >
                  <RiShieldCheckLine className="text-lg" />
                  Désactiver le 2FA
                </button>
              ) : (
                <button
                  onClick={() => handleOpen2FAModal('enable')}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-k2l-success bg-white py-3 font-head text-sm font-semibold text-k2l-success hover:bg-k2l-success-light transition-colors"
                >
                  <RiShieldCheckLine className="text-lg" />
                  Activer le 2FA
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Info card */}
        <div className="lg:col-span-2">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-head text-lg font-semibold text-k2l-gray-900">Informations personnelles</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {infoRows.map((row) => (
                <div key={row.label} className="flex items-center gap-3 rounded-lg bg-k2l-gray-50 p-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-k2l-primary-light text-k2l-primary">
                    {row.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-k2l-gray-500">{row.label}</div>
                    <div className="text-sm font-medium text-k2l-gray-900">{row.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Password change modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-head text-lg font-semibold">Changer le mot de passe</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-k2l-gray-400">
                <RiCloseLine className="text-2xl" />
              </button>
            </div>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-k2l-gray-700">Nouveau mot de passe</label>
                <div className="relative mt-1">
                  <input
                    required
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-lg border border-k2l-gray-300 px-4 py-2.5 text-sm outline-none focus:border-k2l-primary pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-k2l-gray-400"
                  >
                    {showNewPassword ? <RiEyeOffLine className="text-xl" /> : <RiEyeLine className="text-xl" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-k2l-gray-700">Confirmer le mot de passe</label>
                <div className="relative mt-1">
                  <input
                    required
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg border border-k2l-gray-300 px-4 py-2.5 text-sm outline-none focus:border-k2l-primary pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-k2l-gray-400"
                  >
                    {showConfirmPassword ? <RiEyeOffLine className="text-xl" /> : <RiEyeLine className="text-xl" />}
                  </button>
                </div>
              </div>
              {error && <p className="text-sm text-k2l-red">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 rounded-lg border border-k2l-gray-300 py-2.5 text-sm font-medium text-k2l-gray-700 hover:bg-k2l-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-lg bg-k2l-primary py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:bg-k2l-primary-dark"
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
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-head text-lg font-semibold">Modifier mes informations</h3>
              <button onClick={() => setShowEditModal(false)} className="text-k2l-gray-400">
                <RiCloseLine className="text-2xl" />
              </button>
            </div>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-k2l-gray-700">Nom complet</label>
                <input
                  required
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-k2l-gray-300 px-4 py-2.5 text-sm outline-none focus:border-k2l-primary"
                  placeholder="Votre nom complet"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-k2l-gray-700">Genre</label>
                <select
                  value={editGender}
                  onChange={(e) => setEditGender(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-k2l-gray-300 px-4 py-2.5 text-sm outline-none focus:border-k2l-primary"
                >
                  <option value="">Non renseigné</option>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-k2l-gray-700">Téléphone</label>
                <input
                  required
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-k2l-gray-300 px-4 py-2.5 text-sm outline-none focus:border-k2l-primary"
                  placeholder="Votre numéro de téléphone"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-k2l-gray-700">Email (optionnel)</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-k2l-gray-300 px-4 py-2.5 text-sm outline-none focus:border-k2l-primary"
                  placeholder="votre@email.com"
                />
              </div>
              {error && <p className="text-sm text-k2l-red">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 rounded-lg border border-k2l-gray-300 py-2.5 text-sm font-medium text-k2l-gray-700 hover:bg-k2l-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-lg bg-k2l-primary py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:bg-k2l-primary-dark"
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2FA Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-head text-lg font-semibold">
                {twoFactorAction === 'enable' ? 'Activer l\'authentification à double facteur' : 'Désactiver l\'authentification à double facteur'}
              </h3>
              <button onClick={() => setShow2FAModal(false)} className="text-k2l-gray-400">
                <RiCloseLine className="text-2xl" />
              </button>
            </div>

            {twoFactorAction === 'enable' && qrCode && (
              <div className="mb-4">
                <p className="mb-3 text-sm text-k2l-gray-600">
                  Scannez ce QR code avec votre application d'authentification (Google Authenticator, Authy, etc.)
                </p>
                <div className="flex justify-center rounded-lg bg-k2l-gray-50 p-4">
                  <img src={qrCode} alt="QR Code 2FA" className="h-48 w-48" />
                </div>
              </div>
            )}

            <form onSubmit={twoFactorAction === 'enable' ? handleVerify2FA : handleDisable2FA} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-k2l-gray-700">
                  {twoFactorAction === 'enable' ? 'Code de vérification' : 'Entrez votre code 2FA pour désactiver'}
                </label>
                <input
                  required
                  type="text"
                  value={twoFactorToken}
                  onChange={(e) => setTwoFactorToken(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-k2l-gray-300 px-4 py-2.5 text-sm outline-none focus:border-k2l-primary text-center text-lg tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  pattern="[0-9]{6}"
                />
                <p className="mt-1 text-xs text-k2l-gray-500">
                  Entrez le code à 6 chiffres de votre application
                </p>
              </div>
              {error && <p className="text-sm text-k2l-red">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShow2FAModal(false)}
                  className="flex-1 rounded-lg border border-k2l-gray-300 py-2.5 text-sm font-medium text-k2l-gray-700 hover:bg-k2l-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`flex-1 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${
                    twoFactorAction === 'enable' 
                      ? 'bg-k2l-success hover:bg-k2l-success-dark' 
                      : 'bg-k2l-red hover:bg-k2l-red-dark'
                  }`}
                >
                  {saving ? 'Vérification...' : twoFactorAction === 'enable' ? 'Activer' : 'Désactiver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
