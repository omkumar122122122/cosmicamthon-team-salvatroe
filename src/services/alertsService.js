import { apiClient } from './apiClient';

/**
 * Unwrap helper — the backend returns:
 *   { success: true, data: { data: Alert[], stats: {...} } }
 * After unwrap the caller receives:
 *   { data: Alert[], stats: { total, high, pending } }
 * If response is an error or doesn't have expected format, returns empty data structure
 */
const unwrap = (response) => {
  if (!response) return { data: [], stats: { total: 0, high: 0, pending: 0 } };
  if (response?.success) return response.data;
  // Return empty structure for error responses
  return { data: [], stats: { total: 0, high: 0, pending: 0 } };
};

export const alertsService = {
  /**
   * GET /alerts
   * Optional query params: { status, severity, type }
   * Returns: { data: Alert[], stats: { total, high, pending } }
   */
  getAll: (params = {}) =>
    apiClient.get('/alerts', params).then(unwrap),

  /**
   * PATCH /alerts/:id/resolve
   * Returns: { success: true, message: string }
   */
  resolve: (id) =>
    apiClient.patch(`/alerts/${id}/resolve`, {}).then(unwrap),
};
