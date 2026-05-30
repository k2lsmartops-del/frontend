import axios from 'axios';

// En développement: utilise le proxy Vite (/api)
// En production: utilise l'URL complète du backend
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Timer pour le refresh préventif
let refreshTimer: number | null = null;

// Fonction pour décoder le JWT et obtenir l'expiration
function getTokenExpiration(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.exp ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

// Fonction pour refresh le token proactivement
async function proactiveRefresh() {
  try {
    const tokens = localStorage.getItem('tokens');
    if (!tokens) return;
    const { refreshToken } = JSON.parse(tokens) as { refreshToken: string };
    const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
    localStorage.setItem('tokens', JSON.stringify(data.tokens));
    // Planifier le prochain refresh
    scheduleProactiveRefresh(data.tokens.accessToken);
  } catch {
    // Si le refresh échoue, on ne fait rien (le reactive refresh s'occupera de ça)
    console.warn('Proactive refresh failed, will retry on next 401');
  }
}

// Planifier le refresh proactif (1 minute avant expiration)
function scheduleProactiveRefresh(accessToken: string) {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
  }
  
  const expiration = getTokenExpiration(accessToken);
  if (!expiration) return;
  
  const now = Date.now();
  const timeUntilExpiration = expiration - now;
  const refreshBefore = 60 * 1000; // 1 minute avant expiration
  
  if (timeUntilExpiration > refreshBefore) {
    const delay = timeUntilExpiration - refreshBefore;
    refreshTimer = setTimeout(proactiveRefresh, delay);
  }
}

// Initialiser le refresh proactif au démarrage
const tokens = localStorage.getItem('tokens');
if (tokens) {
  const { accessToken } = JSON.parse(tokens) as { accessToken: string };
  scheduleProactiveRefresh(accessToken);
}

api.interceptors.request.use((config) => {
  const tokens = localStorage.getItem('tokens');
  if (tokens) {
    const { accessToken } = JSON.parse(tokens) as { accessToken: string };
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const tokens = localStorage.getItem('tokens');
        if (!tokens) throw new Error('No tokens');
        const { refreshToken } = JSON.parse(tokens) as { refreshToken: string };
        const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
        localStorage.setItem('tokens', JSON.stringify(data.tokens));
        // Planifier le prochain refresh proactif
        scheduleProactiveRefresh(data.tokens.accessToken);
        original.headers.Authorization = `Bearer ${data.tokens.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('tokens');
        localStorage.removeItem('user');
        if (refreshTimer) {
          clearTimeout(refreshTimer);
          refreshTimer = null;
        }
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
