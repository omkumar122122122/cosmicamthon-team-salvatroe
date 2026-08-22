import { apiClient } from './apiClient';

function unwrap(response) {
  if (response && typeof response === 'object' && 'data' in response && 'success' in response) {
    return response.data;
  }
  return response;
}

class DonationRequestsService {
  /**
   * Donor submits a new physical goods donation schedule request
   */
  async create(data) {
    const response = await apiClient.post('/donation-requests', data);
    return unwrap(response);
  }

  /**
   * Donor views all their submitted donation requests
   */
  async getMyRequests() {
    const response = await apiClient.get('/donation-requests/my');
    return unwrap(response) || [];
  }

  /**
   * Orphanage views all incoming donation requests
   */
  async getIncoming() {
    const response = await apiClient.get('/donation-requests/incoming');
    return unwrap(response) || [];
  }

  /**
   * Orphanage updates the status of a donation request
   * @param {string} id - Donation request ID
   * @param {string} status - ACCEPTED | REJECTED | COMPLETED
   * @param {string} [rejectionReason] - Required when status is REJECTED
   */
  async updateStatus(id, status, rejectionReason = '') {
    const response = await apiClient.patch(`/donation-requests/${id}/status`, {
      status,
      ...(rejectionReason ? { rejectionReason } : {}),
    });
    return unwrap(response);
  }

  /**
   * Donor cancels a pending or accepted donation request
   * @param {string} id - Donation request ID
   */
  async cancel(id) {
    const response = await apiClient.patch(`/donation-requests/${id}/cancel`, {});
    return unwrap(response);
  }
}

export const donationRequestsService = new DonationRequestsService();
