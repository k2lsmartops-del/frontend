import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiWifiLine, RiWifiOffLine } from '@/common/icons';
import { RiEyeLine, RiEyeOffLine } from 'react-icons/ri';
import { authService } from '../services/auth.service';
import { useAuthStore } from '@/common/stores/auth.store';
import { useToastStore } from '@/common/stores/toast.store';
import { useOnlineStatus } from '@/common/hooks/useOnlineStatus';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const showToast = useToastStore((s) => s.show);
  const isOnline = useOnlineStatus();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    console.log('[LOGIN] Button clicked');
    if (!phone.trim() || !password.trim()) {
      showToast('Veuillez remplir tous les champs', 'error');
      return;
    }
    setLoading(true);
    console.log('[LOGIN] Tentative de connexion avec:', { phone, passwordLength: password.length });
    try {
      const response = await authService.login({ identifiant: phone, password });
      console.log('[LOGIN] Succes:', response);
      setAuth(response.user, { accessToken: response.accessToken, refreshToken: response.refreshToken });
      showToast('Bienvenue ! Connexion reussie.', 'success');
      navigate('/', { replace: true });
    } catch (error) {
      console.error('[LOGIN] Erreur:', error);
      showToast('Identifiants incorrects', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen-safe flex-col items-center justify-center bg-gradient-to-br from-k2l-navy-deep via-k2l-navy to-k2l-primary px-7 py-10 gap-8"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top) + 2.5rem)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 2.5rem)',
        paddingLeft: 'calc(env(safe-area-inset-left) + 1.75rem)',
        paddingRight: 'calc(env(safe-area-inset-right) + 1.75rem)',
      }}
    >
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/95 shadow-lg">
          <img src="/logo.jpeg" alt="K2L SmartOPs" className="h-16 w-16 object-contain" />
        </div>
        <h1 className="font-head text-[26px] font-bold tracking-tight text-white">K2L SmartOPs</h1>
        <p className="mt-1 text-[13px] text-white/75">Collecter. Superviser. Piloter.</p>
      </div>

      <div className="w-full max-w-sm rounded-xl bg-white p-7 shadow-[0_8px_40px_rgba(28,46,79,0.22)]">
        <h2 className="mb-5 font-head text-[17px] font-semibold text-k2l-gray-900">Connexion Agent</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-k2l-gray-600">Telephone</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ex: 0701234567"
              className="w-full rounded-sm border-[1.5px] border-k2l-gray-200 bg-white px-3.5 py-3 font-body text-[15px] text-k2l-gray-900 outline-none transition-colors focus:border-k2l-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-k2l-gray-600">Mot de passe</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********"
                className="w-full rounded-sm border-[1.5px] border-k2l-gray-200 bg-white px-3.5 py-3 font-body text-[15px] text-k2l-gray-900 outline-none transition-colors focus:border-k2l-primary pr-10" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-k2l-gray-400 hover:text-k2l-gray-600"
              >
                {showPassword ? <RiEyeOffLine className="text-lg" /> : <RiEyeLine className="text-lg" />}
              </button>
            </div>
          </div>
          <button type="button" disabled={loading} onClick={handleLogin}
            className="w-full rounded-md bg-k2l-primary py-3.5 font-head text-[15px] font-semibold tracking-wide text-white transition-all active:scale-[0.98] active:bg-k2l-navy disabled:opacity-60">
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </div>
        <div className="mt-3.5 flex items-center gap-2 rounded-sm bg-k2l-amber-light px-3 py-2">
          {isOnline ? <RiWifiLine className="shrink-0 text-k2l-primary" /> : <RiWifiOffLine className="shrink-0 text-k2l-amber" />}
          <span className="text-xs text-[#854F0B]">
            {isOnline ? 'Mode hors-ligne disponible' : 'Vous etes hors-ligne'}
          </span>
        </div>
      </div>
    </div>
  );
}
