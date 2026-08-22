import { apiClient } from './apiClient';

const dashboardService = {
  // Admin Dashboard APIs
  getAdminStats: () => apiClient.get('/dashboard/admin/stats'),
  
  getAdminCharts: () => apiClient.get('/dashboard/admin/charts'),
  
  getAdminRecentChildren: () => apiClient.get('/dashboard/admin/recent-children'),
};

export default dashboardService;
