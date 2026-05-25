import { useState, useEffect, useCallback } from 'react';
import { RiLoader4Line } from '@/common/icons';
import api from '@/common/services/api';

interface TeamMember {
  id: string;
  fullName: string;
  matricule: string;
  status: string;
  phone?: string;
  submissionCount?: number;
  validatedCount?: number;
  lastActivity?: string;
}

type Filter = 'all' | 'active' | 'inactive';

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');

  const loadTeam = useCallback(async () => {
    try {
      const { data } = await api.get('/users/team');
      setMembers(data || []);
    } catch {
      // Endpoint peut ne pas exister, on simule des données vides
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

  return (
    <div className="min-h-full bg-k2l-gray-100">
      {/* Header */}
      <div className="bg-k2l-navy px-5 py-4">
        <div className="flex items-center justify-between">
          <span className="font-head text-[15px] font-semibold text-white">Mon équipe</span>
          <span className="text-xs text-white/70">{members.length} commerciaux</span>
        </div>
      </div>

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
