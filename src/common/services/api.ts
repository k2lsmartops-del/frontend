import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
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
        const { data } = await axios.post('/api/auth/refresh', { refreshToken });
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
