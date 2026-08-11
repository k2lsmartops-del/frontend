import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import {
  RiCheckboxLine,
  RiCheckboxBlankLine,
  RiMapPinLine,
  RiStore2Line,
  RiUserLine,
  RiLoader4Line,
} from 'react-icons/ri';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '@/common/services/api';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Submission {
  id: string;
  type: string;
  prospectFullName?: string;
  prospectPhone?: string;
  merchantName?: string;
  merchantPhone?: string;
  commune?: string;
  quartier?: string;
  latitude?: number;
  longitude?: number;
  appStatus?: string;
  validatedAt?: string;
}

type PeriodFilter = '24h' | 'week' | 'month';

export default function ClientMapPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProspects, setShowProspects] = useState(true);
  const [showMerchants, setShowMerchants] = useState(true);
  const [showActivatedOnly, setShowActivatedOnly] = useState(false);
  const [period, setPeriod] = useState<PeriodFilter>('week');

  useEffect(() => {
    loadSubmissions();
  }, [period]);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      // Mapper les périodes frontend vers backend
      const periodMap: Record<PeriodFilter, string> = {
        '24h': 'day',
        'week': 'week',
        'month': 'month',
      };
      const res = await api.get('/submissions', { 
        params: { 
          status: 'VALIDATED', 
          limit: 1000,
          period: periodMap[period]
        } 
      });
      setSubmissions(res.data.data || []);
    } catch (error) {
      console.error('Erreur de chargement des soumissions', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubmissions = submissions.filter((s) => {
    if (!s.latitude || !s.longitude) return false;
    if (s.type === 'PROSPECT' && !showProspects) return false;
    if (s.type === 'MERCHANT' && !showMerchants) return false;
    if (showActivatedOnly && s.appStatus !== 'INSTALLED_ACTIVATED') return false;
    return true;
  });

  const prospectCount = submissions.filter((s) => s.type === 'PROSPECT').length;
  const merchantCount = submissions.filter((s) => s.type === 'MERCHANT').length;

  const center: [number, number] = filteredSubmissions.length > 0
    ? [filteredSubmissions[0].latitude!, filteredSubmissions[0].longitude!]
    : [5.3364, -4.0264];

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <RiLoader4Line className="animate-spin text-4xl text-k2l-primary" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[260px_1fr] gap-4 h-[calc(100vh-180px)]">
      {/* Filtres */}
      <div className="rounded-xl border border-k2l-gray-200 bg-white p-5">
        <h3 className="mb-4 font-head text-sm font-semibold">Filtres</h3>
        
        <div className="space-y-2">
          <button
            onClick={() => setShowProspects(!showProspects)}
            className="flex w-full items-center gap-2 text-xs text-k2l-gray-600"
          >
            {showProspects ? (
              <RiCheckboxLine className="text-base text-k2l-success" />
            ) : (
              <RiCheckboxBlankLine className="text-base text-k2l-gray-300" />
            )}
            Prospects ({prospectCount})
          </button>
          
          <button
            onClick={() => setShowMerchants(!showMerchants)}
            className="flex w-full items-center gap-2 text-xs text-k2l-gray-600"
          >
            {showMerchants ? (
              <RiCheckboxLine className="text-base text-k2l-success" />
            ) : (
              <RiCheckboxBlankLine className="text-base text-k2l-gray-300" />
            )}
            Marchands ({merchantCount})
          </button>
          
          <button
            onClick={() => setShowActivatedOnly(!showActivatedOnly)}
            className="flex w-full items-center gap-2 text-xs text-k2l-gray-600"
          >
            {showActivatedOnly ? (
              <RiCheckboxLine className="text-base text-k2l-success" />
            ) : (
              <RiCheckboxBlankLine className="text-base text-k2l-gray-300" />
            )}
            Prospects actives uniquement
          </button>
        </div>

        <div className="mt-5">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-500">Periode</div>
          <div className="flex gap-1 rounded-lg bg-k2l-gray-100 p-1">
            <button
              onClick={() => setPeriod('24h')}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs ${
                period === '24h' ? 'bg-white font-semibold shadow-sm' : 'text-k2l-gray-500'
              }`}
            >
              24h
            </button>
            <button
              onClick={() => setPeriod('week')}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs ${
                period === 'week' ? 'bg-white font-semibold shadow-sm' : 'text-k2l-gray-500'
              }`}
            >
              Semaine
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs ${
                period === 'month' ? 'bg-white font-semibold shadow-sm' : 'text-k2l-gray-500'
              }`}
            >
              Mois
            </button>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-k2l-gray-500">Legende</div>
          <div className="space-y-2 text-[11px] text-k2l-gray-600">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-k2l-success" />
              Prospect active
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-k2l-amber" />
              Prospect installe
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-k2l-blue" />
              Marchand
            </div>
          </div>
        </div>
      </div>

      {/* Carte */}
      <div className="overflow-hidden rounded-xl border border-k2l-gray-200">
        {filteredSubmissions.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center bg-white text-k2l-gray-400">
            <RiMapPinLine className="mb-2 text-4xl" />
            <p className="font-medium">Aucun point geographique disponible</p>
            <p className="text-sm">Les soumissions doivent inclure des coordonnees GPS</p>
          </div>
        ) : (
          <MapContainer
            center={center}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filteredSubmissions.map((submission) => (
              <Marker
                key={submission.id}
                position={[submission.latitude!, submission.longitude!]}
              >
                <Popup>
                  <div className="min-w-[200px]">
                    <div className="mb-2 flex items-center gap-2">
                      {submission.type === 'PROSPECT' ? (
                        <RiUserLine className="text-k2l-success" />
                      ) : (
                        <RiStore2Line className="text-k2l-amber" />
                      )}
                      <span className="font-semibold">{submission.type}</span>
                    </div>
                    
                    {submission.type === 'PROSPECT' ? (
                      <div className="space-y-1 text-sm">
                        <div><strong>Nom:</strong> {submission.prospectFullName || '-'}</div>
                        <div><strong>Telephone:</strong> {submission.prospectPhone || '-'}</div>
                      </div>
                    ) : (
                      <div className="space-y-1 text-sm">
                        <div><strong>Nom:</strong> {submission.merchantName || '-'}</div>
                        <div><strong>Telephone:</strong> {submission.merchantPhone || '-'}</div>
                      </div>
                    )}
                    
                    <div className="mt-2 text-sm">
                      <div><strong>Localisation:</strong> {submission.commune}{submission.quartier ? `, ${submission.quartier}` : ''}</div>
                      {submission.validatedAt && (
                        <div><strong>Date:</strong> {new Date(submission.validatedAt).toLocaleDateString('fr-FR')}</div>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
}
