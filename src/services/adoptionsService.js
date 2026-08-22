import { apiClient } from './apiClient';

const unwrap = (response) => response?.success ? response.data : response;

export const adoptionsService = {
  async verify(parentId, childId) { return unwrap(await apiClient.get('/adoptions/verify', { parentId, childId })); },
  async getAll(params = {}) { return unwrap(await apiClient.get('/adoptions', params)); },
  async create(data) { return unwrap(await apiClient.post('/adoptions', data)); },
  async uploadDocument(id, documentType, file) {
    const form = new FormData();
    form.append('documentType', documentType);
    form.append('file', file);
    return unwrap(await apiClient.post(`/adoptions/${id}/documents`, form));
  },
  async updateStatus(id, data) { return unwrap(await apiClient.patch(`/adoptions/${id}/status`, data)); },
};
