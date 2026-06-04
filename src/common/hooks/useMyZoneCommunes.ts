import { useState, useEffect } from 'react';
import api from '@/common/services/api';

export interface Quartier {
  id: string;
  name: string;
  secteurId: string | null;
}

export interface Commune {
  id: string;
  name: string;
  quartiers: Quartier[];
}

export interface MyZoneData {
  zone: { id: string; name: string } | null;
  communes: Commune[];
}

/**
 * Hook pour récupérer les communes et quartiers de la zone du commercial connecté.
 * Permet la sélection rapide lors de la création de soumission.
 */
export function useMyZoneCommunes() {
  const [data, setData] = useState<MyZoneData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.get<MyZoneData>('/communes/my-zone');
        setData(response.data);
        setError(null);
      } catch (err) {
        console.error('Erreur chargement communes:', err);
        setError('Impossible de charger les communes');
        setData({ zone: null, communes: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
}
