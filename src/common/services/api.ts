import axios from 'axios';

// En développement: utilise le proxy Vite (/api)
// En production: utilise l'URL complète du backend
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

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
        original.headers.Authorization = `Bearer ${data.tokens.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('tokens');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
