import { apiClient } from './apiClient';

function unwrap(response) {
  if (response && typeof response === 'object' && 'data' in response && 'success' in response) {
    return response.data;
  }
  return response;
}

const notificationsService = {
  // Get user's notifications with pagination and filters
  getAll: async (params = {}) => unwrap(await apiClient.get('/notifications', params)),

  // Get unread count for badge
  getUnreadCount: async () => unwrap(await apiClient.get('/notifications/unread-count')),

  // Get notification by ID
  getById: async (id) => unwrap(await apiClient.get(`/notifications/${id}`)),

  // Mark single notification as read
  markAsRead: async (id) => unwrap(await apiClient.patch(`/notifications/${id}/read`)),

  // Mark all notifications as read
  markAllAsRead: async () => unwrap(await apiClient.patch('/notifications/read-all')),

  // Delete a notification
  delete: async (id) => unwrap(await apiClient.delete(`/notifications/${id}`)),

  // Clear all read notifications
  clearRead: async () => unwrap(await apiClient.delete('/notifications/clear-read/all')),
};

export default notificationsService;
