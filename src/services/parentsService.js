import { apiClient } from './apiClient';

// Helper: unwrap the TransformInterceptor envelope
// Backend wraps all responses as: { success, statusCode, data: <payload>, timestamp }
function unwrap(response) {
  if (response && typeof response === 'object' && 'data' in response && 'success' in response) {
    return response.data;
  }
  return response;
}

/**
 * Parents Service — handles all parent-related API calls
 */
class ParentsService {
  /** Register a new parent user (public endpoint) */
   async registerParent(parentData) {
     const response = await apiClient.post('/parents/register', parentData);
     return unwrap(response);
   }

  /** Create a new parent profile */
  async createParent(parentData) {
    const response = await apiClient.post('/parents', parentData);
    return unwrap(response);
  }

  /** Get all parents with filters and pagination */
  async getAllParents(params = {}) {
    const response = await apiClient.get('/parents', params);
    return unwrap(response);
  }

  /** Get parent profile by ID */
  async getParentById(id) {
    const response = await apiClient.get(`/parents/${id}`);
    return unwrap(response);
  }

  /** Update parent profile */
  async updateParent(id, updates) {
    const response = await apiClient.patch(`/parents/${id}`, updates);
    return unwrap(response);
  }

  /** Delete parent profile (soft delete) */
  async deleteParent(id) {
    const response = await apiClient.delete(`/parents/${id}`);
    return unwrap(response);
  }

  /**
   * Get parent dashboard data (for logged-in parent)
   * Backend: GET /parents/dashboard
   * Returns: { parent, verification, linkedChild, adoptionJourney }
   */
  async getDashboard() {
    const response = await apiClient.get('/parents/dashboard');
    return unwrap(response);
  }

  /** Get parent KYC status */
  async getKycStatus() {
    const response = await apiClient.get('/parents/kyc');
    return unwrap(response);
  }

  /** Submit KYC package for review */
  async submitKyc(notes) {
    const response = await apiClient.post('/parents/kyc/submit', { notes });
    return unwrap(response);
  }

  /** Upload a parent document */
  async uploadDocument(parentId, documentType, file, documentNumber) {
    const formData = new FormData();
    formData.append('documentType', documentType);
    if (documentNumber) formData.append('documentNumber', documentNumber);
    formData.append('file', file);

    const response = await apiClient.post(`/parents/${parentId}/documents`, formData);
    return unwrap(response);
  }

  /** Upload multiple parent documents in batch */
  async uploadBatchDocuments(parentId, items) {
    const formData = new FormData();
    items.forEach(({ file, documentType }) => {
      formData.append('files', file);
      formData.append('documentTypes', documentType);
    });

    const response = await apiClient.post(`/parents/${parentId}/documents/batch`, formData);
    return unwrap(response);
  }

  /** Review a parent document (Admin only) */
  async reviewDocument(parentId, documentId, reviewData) {
    const response = await apiClient.patch(`/parents/${parentId}/documents/${documentId}`, reviewData);
    return unwrap(response);
  }

  /** Add an address to a parent profile */
  async addAddress(parentId, addressData) {
    const response = await apiClient.post(`/parents/${parentId}/addresses`, addressData);
    return unwrap(response);
  }

  /** Add a family member to a parent profile */
  async addFamilyMember(parentId, memberData) {
    const response = await apiClient.post(`/parents/${parentId}/family-members`, memberData);
    return unwrap(response);
  }

  /** Manually adjust parent trust score (Admin only) */
  async updateTrustScore(parentId, delta, reason) {
    const response = await apiClient.post(`/parents/${parentId}/trust-score`, { delta, reason });
    return unwrap(response);
  }

  /** Update parent verification status (Admin only) */
  async updateVerificationStatus(id, statusData) {
    const response = await apiClient.patch(`/parents/${id}/verification-status`, statusData);
    return unwrap(response);
  }

  /** Approve parent application (Admin only) */
  async approveParent(id) {
    const response = await apiClient.post(`/parents/${id}/approve`);
    return unwrap(response);
  }

  /** Reject parent application (Admin only) */
  async rejectParent(id, reason) {
    const response = await apiClient.post(`/parents/${id}/reject`, { reason });
    return unwrap(response);
  }

  /** Request document re-upload from parent (Admin only) */
  async requestReupload(id, reason, documentTypes = []) {
    const response = await apiClient.post(`/parents/${id}/request-reupload`, { reason, documentTypes });
    return unwrap(response);
  }

  /**
   * Get verification queue (Admin only)
   * Backend: GET /admin/parents/verification/queue
   */
  async getVerificationQueue(params = {}) {
    const response = await apiClient.get('/admin/parents/verification/queue', params);
    return unwrap(response);
  }

  /** Get full parent verification details (Admin only) */
  async getVerificationDetails(id) {
    const response = await apiClient.get(`/admin/parents/${id}/verification-details`);
    return unwrap(response);
  }
}

export const parentsService = new ParentsService();