import api from '@/common/services/api';
import type { CreateSubmissionPayload, PaginatedResponse, Submission } from '@/common/types';

export const submissionService = {
  create: async (payload: CreateSubmissionPayload): Promise<Submission> => {
    const { data } = await api.post<Submission>('/submissions', payload);
    return data;
  },
  syncBatch: async (submissions: CreateSubmissionPayload[]) => {
    const { data } = await api.post('/submissions/sync', { submissions });
    return data;
  },
  list: async (params: Record<string, string | number | undefined>): Promise<PaginatedResponse<Submission>> => {
    const { data } = await api.get<PaginatedResponse<Submission>>('/submissions', { params });
    return data;
  },
  getById: async (id: string): Promise<Submission> => {
    const { data } = await api.get<Submission>(`/submissions/${id}`);
    return data;
  },
};
