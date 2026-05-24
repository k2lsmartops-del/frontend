import api from '@/common/services/api';
import type { LoginPayload, LoginResponse } from '@/common/types';

export const authService = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>('/auth/login', payload);
    return data;
  },
  logout: async (refreshToken: string): Promise<void> => {
    await api.post('/auth/logout', { refreshToken });
  },
};
