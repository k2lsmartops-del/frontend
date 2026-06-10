import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  RiArrowLeftLine,
  RiUserLine,
  RiPhoneLine,
  RiMailLine,
  RiCalendarLine,
  RiMapPin2Line,
  RiTimeLine,
  RiWifiLine,
  RiWifiOffLine,
  RiDownloadLine,
  RiCheckLine,
  RiCloseLine,
  RiLoader4Line,
  RiBarChartLine,
  RiMoneyDollarCircleLine,
} from 'react-icons/ri';
import api from '@/common/services/api';

interface User {
  id: string;
  fullName: string;
  matricule: string;
  phone: string;
  email?: string;
  role: string;
  cluster?: { name: string };
  createdAt: string;
  lastLogin?: string;
  appInstalled: boolean;
  lastActive?: string;
  isOnline: boolean;
}

interface UserStats {
  totalSubmissions: number;
  validatedSubmissions: number;
  rejectedSubmissions: number;
  todaySubmissions: number;
  weekSubmissions: number;
  validationRate: number;
}

interface PaymentInfo {
  totalEarned: number;
  pendingPayment: number;
  paidAmount: number;
  ratePerSubmission: number;
}

export default function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    try {
      const [userRes, statsRes, paymentRes] = await Promise.all([
        api.get(`/users/${userId}`),
        api.get(`/users/${userId}/stats`),
        api.get(`/users/${userId}/payment`),
      ]);
      setUser(userRes.data);
      setStats(statsRes.data);
      setPayment(paymentRes.data);
    } catch (error) {
      console.error('Erreur de chargement des données utilisateur', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-k2l-gray-100">
        <RiLoader4Line className="animate-spin text-4xl text-k2l-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-k2l-gray-100">
        <p className="text-k2l-gray-500">Utilisateur non trouvé</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-k2l-gray-100 pb-4">
      {/* Header */}
      <div className="bg-k2l-navy px-5 pb-7 pt-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/team')}
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/30 bg-white/15 text-white"
          >
            <RiArrowLeftLine className="text-lg" />
          </button>
          <div className="flex-1">
            <div className="font-head text-base font-semibold text-white">{user.fullName}</div>
            <div className="text-[11px] text-white/60">{user.matricule}</div>
          </div>
          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold ${
            user.isOnline ? 'bg-k2l-success text-white' : 'bg-k2l-gray-600 text-white'
          }`}>
            {user.isOnline ? (
              <><RiWifiLine className="text-sm" /><span>En ligne</span></>
            ) : (
              <><RiWifiOffLine className="text-sm" /><span>Hors ligne</span></>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Informations de base */}
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-head text-sm font-semibold text-k2l-gray-800">Informations personnelles</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <RiUserLine className="text-k2l-gray-400" />
              <div className="flex-1">
                <div className="text-[11px] text-k2l-gray-400">Nom complet</div>
                <div className="text-sm font-medium text-k2l-gray-800">{user.fullName}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <RiPhoneLine className="text-k2l-gray-400" />
              <div className="flex-1">
                <div className="text-[11px] text-k2l-gray-400">Téléphone</div>
                <div className="text-sm font-medium text-k2l-gray-800">{user.phone}</div>
              </div>
            </div>
            {user.email && (
              <div className="flex items-center gap-3">
                <RiMailLine className="text-k2l-gray-400" />
                <div className="flex-1">
                  <div className="text-[11px] text-k2l-gray-400">Email</div>
                  <div className="text-sm font-medium text-k2l-gray-800">{user.email}</div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <RiMapPin2Line className="text-k2l-gray-400" />
              <div className="flex-1">
                <div className="text-[11px] text-k2l-gray-400">Cluster</div>
                <div className="text-sm font-medium text-k2l-gray-800">{user.cluster?.name || 'Non assigné'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <RiCalendarLine className="text-k2l-gray-400" />
              <div className="flex-1">
                <div className="text-[11px] text-k2l-gray-400">Inscrit le</div>
                <div className="text-sm font-medium text-k2l-gray-800">
                  {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                </div>
              </div>
            </div>
            {user.lastLogin && (
              <div className="flex items-center gap-3">
                <RiTimeLine className="text-k2l-gray-400" />
                <div className="flex-1">
                  <div className="text-[11px] text-k2l-gray-400">Dernière connexion</div>
                  <div className="text-sm font-medium text-k2l-gray-800">
                    {new Date(user.lastLogin).toLocaleString('fr-FR')}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Statut de l'application */}
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-head text-sm font-semibold text-k2l-gray-800">Statut de l'application</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                user.appInstalled ? 'bg-k2l-success/10' : 'bg-k2l-red/10'
              }`}>
                {user.appInstalled ? (
                  <RiCheckLine className={`text-xl ${user.appInstalled ? 'text-k2l-success' : 'text-k2l-red'}`} />
                ) : (
                  <RiCloseLine className="text-xl text-k2l-red" />
                )}
              </div>
              <div>
                <div className="text-sm font-semibold text-k2l-gray-800">
                  {user.appInstalled ? 'Application installée' : 'Application non installée'}
                </div>
                <div className="text-[11px] text-k2l-gray-400">
                  {user.lastActive ? `Dernière activité: ${new Date(user.lastActive).toLocaleString('fr-FR')}` : 'Jamais active'}
                </div>
              </div>
            </div>
            {!user.appInstalled && (
              <button className="flex items-center gap-1.5 rounded-lg bg-k2l-primary px-3 py-2 text-[11px] font-semibold text-white">
                <RiDownloadLine />
                Envoyer lien
              </button>
            )}
          </div>
        </div>

        {/* Statistiques */}
        {stats && (
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <h3 className="mb-3 font-head text-sm font-semibold text-k2l-gray-800">Statistiques de performance</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-k2l-gray-50 p-3">
                <div className="text-[11px] text-k2l-gray-400">Total soumissions</div>
                <div className="mt-1 font-head text-2xl font-bold text-k2l-gray-900">
                  {stats.totalSubmissions}
                </div>
              </div>
              <div className="rounded-lg bg-k2l-success/10 p-3">
                <div className="text-[11px] text-k2l-gray-400">Validées</div>
                <div className="mt-1 font-head text-2xl font-bold text-k2l-success">
                  {stats.validatedSubmissions}
                </div>
              </div>
              <div className="rounded-lg bg-k2l-red/10 p-3">
                <div className="text-[11px] text-k2l-gray-400">Rejetées</div>
                <div className="mt-1 font-head text-2xl font-bold text-k2l-red">
                  {stats.rejectedSubmissions}
                </div>
              </div>
              <div className="rounded-lg bg-k2l-primary/10 p-3">
                <div className="text-[11px] text-k2l-gray-400">Taux de validation</div>
                <div className="mt-1 font-head text-2xl font-bold text-k2l-primary">
                  {stats.validationRate}%
                </div>
              </div>
              <div className="rounded-lg bg-k2l-amber/10 p-3">
                <div className="text-[11px] text-k2l-gray-400">Aujourd'hui</div>
                <div className="mt-1 font-head text-2xl font-bold text-k2l-amber">
                  {stats.todaySubmissions}
                </div>
              </div>
              <div className="rounded-lg bg-k2l-blue/10 p-3">
                <div className="text-[11px] text-k2l-gray-400">Cette semaine</div>
                <div className="mt-1 font-head text-2xl font-bold text-k2l-blue">
                  {stats.weekSubmissions}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Paiements */}
        {payment && (
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <h3 className="mb-3 font-head text-sm font-semibold text-k2l-gray-800 flex items-center gap-2">
              <RiMoneyDollarCircleLine className="text-k2l-primary" />
              Paiements
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-k2l-gray-600">Taux par soumission</span>
                <span className="text-sm font-semibold text-k2l-gray-800">
                  {payment.ratePerSubmission.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-k2l-gray-600">Total gagné</span>
                <span className="text-sm font-semibold text-k2l-success">
                  {payment.totalEarned.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-k2l-gray-600">Montant payé</span>
                <span className="text-sm font-semibold text-k2l-gray-800">
                  {payment.paidAmount.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-k2l-primary/10 p-3">
                <span className="text-sm font-semibold text-k2l-primary">À payer</span>
                <span className="text-base font-bold text-k2l-primary">
                  {payment.pendingPayment.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Actions rapides */}
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-head text-sm font-semibold text-k2l-gray-800">Actions rapides</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 rounded-lg border border-k2l-gray-200 px-4 py-3 text-sm font-medium text-k2l-gray-700 hover:bg-k2l-gray-50">
              <RiBarChartLine />
              Voir détails
            </button>
            <button className="flex items-center justify-center gap-2 rounded-lg bg-k2l-primary px-4 py-3 text-sm font-medium text-white hover:bg-k2l-primary/90">
              <RiMoneyDollarCircleLine />
              Gérer paiements
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
