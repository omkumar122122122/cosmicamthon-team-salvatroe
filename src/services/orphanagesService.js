import { apiClient } from './apiClient';

// Helper: unwrap the TransformInterceptor envelope
// Backend always wraps responses as: { success, statusCode, data: <payload>, timestamp }
// We extract .data so callers receive the actual payload directly.
function unwrap(response) {
  if (response && typeof response === 'object' && 'data' in response && 'success' in response) {
    return response.data;
  }
  return response;
}

export const orphanagesService = {
  /**
   * Get all orphanages with filters and pagination
   * @param {Object} params - Query parameters (page, limit, search, organizationType, city, state, minCompliance, maxCompliance, sortBy, sortOrder)
   * @returns {Promise<{ data: Array, pagination: Object }>}
   */
  async getAll(params = {}) {
    const cleanParams = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== '')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    const response = await apiClient.get('/orphanages', cleanParams);
    return unwrap(response);
  },

  /**
   * Get approved orphanages available to parents for visit requests.
   * @returns {Promise<Array<{ id: string, name: string, city?: string, state?: string, profileImage?: string, logo?: string }>>}
   */
  async getApprovedForParents() {
    const response = await apiClient.get('/orphanages/approved');
    return unwrap(response) || [];
  },

  /**
   * Get single orphanage by ID
   * @param {string} id
   * @returns {Promise<Object>} Basic orphanage data
   */
  async getById(id) {
    const response = await apiClient.get(`/orphanages/${id}`);
    return unwrap(response);
  },

  /**
   * Get complete orphanage profile with nested data
   * @param {string} id
   * @returns {Promise<Object>} Complete profile with administrator, KYC, childSummary, staff, facilities, aiSafety, bankDetails
   */
  async getProfile(id) {
    const response = await apiClient.get(`/orphanages/${id}/profile`);
    return unwrap(response);
  },

  /**
   * Get orphanage statistics
   * @param {string} id
   * @returns {Promise<Object>} Statistics: totalAdmissions, adoptedChildrenCount, currentChildrenCount, occupancyPercentage, complianceScore
   */
  async getStatistics(id) {
    const response = await apiClient.get(`/orphanages/${id}/statistics`);
    return unwrap(response);
  },

  /**
   * Register a new orphanage
   * @param {Object} orphanageData - Form data
   * @param {Object} files - File objects { profilePhoto, registrationCertificate, ngoCertificate, governmentLicense, administratorIdProof, panCard, addressProof }
   * @returns {Promise<Object>} Created orphanage response
   */
  async create(orphanageData, files = {}) {
    const formData = new FormData();

    // Append all text fields
    Object.entries(orphanageData).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, value);
      }
    });

    // Append all file fields
    Object.entries(files).forEach(([fieldName, file]) => {
      if (file instanceof File) {
        formData.append(fieldName, file);
      }
    });

    const response = await apiClient.post('/orphanages', formData);
    return unwrap(response);
  },

  /**
   * Update orphanage information
   * @param {string} id
   * @param {Object} updates
   * @returns {Promise<Object>}
   */
  async update(id, updates) {
    const response = await apiClient.put(`/orphanages/${id}`, updates);
    return unwrap(response);
  },

  /**
   * Delete an orphanage (soft delete)
   * @param {string} id
   * @returns {Promise<Object>}
   */
  async delete(id) {
    const response = await apiClient.delete(`/orphanages/${id}`);
    return unwrap(response);
  },

  /**
   * Get dashboard statistics for authenticated orphanage user
   * @returns {Promise<Object>} Dashboard stats: inCare, atRisk, aiStatus, registeredChildren, safeZonesOnline, activeOrphanages, criticalAlerts
   */
  async getDashboardStats() {
    const response = await apiClient.get('/orphanages/dashboard/stats');
    return unwrap(response);
  },

  /**
   * Get children in authenticated orphanage
   * @param {number} limit - Number of children to retrieve
   * @returns {Promise<{ data: Array, total: number }>}
   */
  async getMyChildren(limit = 5) {
    const response = await apiClient.get('/orphanages/my-children', { limit });
    return unwrap(response);
  },

  /**
   * Get monthly safety chart data for authenticated orphanage
   * @returns {Promise<Object>} Chart data with labels and datasets
   */
  async getSafetyChart() {
    const response = await apiClient.get('/orphanages/dashboard/safety-chart');
    return unwrap(response);
  },

  /**
   * Reset orphanage account password (Admin only)
   * @param {string} id
   * @param {string} newPassword
   * @returns {Promise<Object>}
   */
  async resetPassword(id, newPassword) {
    const response = await apiClient.patch(`/orphanages/${id}/reset-password`, { newPassword });
    return unwrap(response);
  },

  /**
   * Enable or disable orphanage account (Admin only)
   * @param {string} id
   * @param {boolean} isActive
   * @returns {Promise<Object>}
   */
  async toggleStatus(id, isActive) {
    const response = await apiClient.patch(`/orphanages/${id}/toggle-status`, { isActive });
    return unwrap(response);
  },

  /**
   * Get nearby orphanages by lat, lng, and radius (5, 10, 25, 50, 100 km)
   * @param {number} lat
   * @param {number} lng
   * @param {number} radius
   * @returns {Promise<Array>}
   */
  async getNearby(lat, lng, radius = 10) {
    const response = await apiClient.get('/orphanages/nearby', { lat, lng, radius });
    return unwrap(response) || [];
  },
};
