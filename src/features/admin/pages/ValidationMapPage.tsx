import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { RiLoader4Line, RiMapPinLine, RiUserLine, RiStore2Line } from 'react-icons/ri';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '@/common/services/api';

// Fix for default marker icon in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Submission {
  id: string;
  type: string;
  status: string;
  prospectFullName?: string;
  prospectPhone?: string;
  merchantName?: string;
  merchantOwner?: string;
  commune?: string;
  quartier?: string;
  latitude?: number;
  longitude?: number;
  submittedAt?: string;
  commercial?: { fullName: string; matricule: string };
}

export default function ValidationMapPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'VALIDATED' | 'SUBMITTED' | 'REJECTED'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'PROSPECT' | 'MERCHANT'>('ALL');

  const loadSubmissions = async () => {
    try {
      const params: any = { limit: 100 };
      if (filter !== 'ALL') {
        params.status = filter;
      }
      const res = await api.get('/submissions', { params });
      setSubmissions(res.data.data || []);
    } catch {
      console.error('Erreur de chargement des soumissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, [filter]);

  const filteredSubmissions = submissions.filter(s => {
    if (typeFilter === 'ALL') return true;
    if (typeFilter === 'PROSPECT') return s.type === 'PROSPECT';
    if (typeFilter === 'MERCHANT') return s.type === 'MERCHANT';
    return true;
  });

  const submissionsWithCoords = filteredSubmissions.filter(s => s.latitude && s.longitude);

  const center: [number, number] = submissionsWithCoords.length > 0
    ? [submissionsWithCoords[0].latitude!, submissionsWithCoords[0].longitude!]
    : [4.0511, 9.7679]; // Centre du Cameroun par défaut

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <RiLoader4Line className="animate-spin text-4xl text-k2l-primary" />
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="mb-4">
        <h2 className="mb-4 font-head text-lg font-semibold text-k2l-gray-800">Carte des soumissions</h2>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-white border border-k2l-gray-200 px-3 py-2">
            <span className="text-sm text-k2l-gray-600">Statut:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="text-sm font-medium text-k2l-gray-800 outline-none bg-transparent"
            >
              <option value="ALL">Tous</option>
              <option value="VALIDATED">Validés</option>
              <option value="SUBMITTED">En attente</option>
              <option value="REJECTED">Rejetés</option>
            </select>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-white border border-k2l-gray-200 px-3 py-2">
            <span className="text-sm text-k2l-gray-600">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="text-sm font-medium text-k2l-gray-800 outline-none bg-transparent"
            >
              <option value="ALL">Tous</option>
              <option value="PROSPECT">Prospects</option>
              <option value="MERCHANT">Commerces</option>
            </select>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-k2l-primary px-3 py-2 text-white">
            <RiMapPinLine />
            <span className="text-sm font-medium">{submissionsWithCoords.length} point(s) sur la carte</span>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="h-[calc(100vh-350px)] rounded-xl overflow-hidden border border-k2l-gray-200">
        {submissionsWithCoords.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-k2l-gray-400">
            <RiMapPinLine className="mb-2 text-4xl" />
            <p className="font-medium">Aucun point géographique disponible</p>
            <p className="text-sm">Les soumissions doivent inclure des coordonnées GPS</p>
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
            {submissionsWithCoords.map((submission) => (
              <Marker
                key={submission.id}
                position={[submission.latitude!, submission.longitude!]}
              >
                <Popup>
                  <div className="min-w-[200px]">
                    <div className="mb-2 flex items-center gap-2">
                      {submission.type === 'PROSPECT' ? (
                        <RiUserLine className="text-k2l-primary" />
                      ) : (
                        <RiStore2Line className="text-k2l-amber" />
                      )}
                      <span className="font-semibold">{submission.type}</span>
                    </div>
                    
                    {submission.type === 'PROSPECT' ? (
                      <div className="space-y-1 text-sm">
                        <div><strong>Nom:</strong> {submission.prospectFullName || '—'}</div>
                        <div><strong>Téléphone:</strong> {submission.prospectPhone || '—'}</div>
                      </div>
                    ) : (
                      <div className="space-y-1 text-sm">
                        <div><strong>Nom:</strong> {submission.merchantName || '—'}</div>
                        <div><strong>Propriétaire:</strong> {submission.merchantOwner || '—'}</div>
                      </div>
                    )}
                    
                    <div className="mt-2 text-sm">
                      <div><strong>Localisation:</strong> {submission.commune}{submission.quartier ? `, ${submission.quartier}` : ''}</div>
                      <div><strong>Statut:</strong> {submission.status}</div>
                      {submission.commercial && (
                        <div><strong>Commercial:</strong> {submission.commercial.fullName}</div>
                      )}
                      {submission.submittedAt && (
                        <div><strong>Date:</strong> {new Date(submission.submittedAt).toLocaleDateString('fr-FR')}</div>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 rounded-lg bg-white border border-k2l-gray-200 p-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-k2l-success" />
          <span className="text-sm text-k2l-gray-700">Validé</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-k2l-amber" />
          <span className="text-sm text-k2l-gray-700">En attente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-k2l-red" />
          <span className="text-sm text-k2l-gray-700">Rejeté</span>
        </div>
        <div className="ml-auto text-xs text-k2l-gray-400">
          Note: Cette solution utilise OpenStreetMap (gratuit). Pour migrer vers Google Maps API, contacter l'équipe technique.
        </div>
      </div>
    </div>
  );
}
